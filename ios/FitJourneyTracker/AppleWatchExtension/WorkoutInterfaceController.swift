import WatchKit
import Foundation
import UserNotifications
import HealthKit

class WorkoutInterfaceController: WKInterfaceController {
    
    @IBOutlet weak var workoutStatusLabel: WKInterfaceLabel!
    @IBOutlet weak var heartRateLabel: WKInterfaceLabel!
    @IBOutlet weak var caloriesLabel: WKInterfaceLabel!
    @IBOutlet weak var durationLabel: WKInterfaceLabel!
    @IBOutlet weak var setRepLabel: WKInterfaceLabel!
    @IBOutlet weak var distanceLabel: WKInterfaceLabel!
    @IBOutlet weak var controlButton: WKInterfaceButton!
    @IBOutlet weak var skipButton: WKInterfaceButton!
    @IBOutlet weak var completeSetButton: WKInterfaceButton!
    @IBOutlet weak var emergencyButton: WKInterfaceButton!
    
    private var workoutSession: HKWorkoutSession?
    private var healthStore = HKHealthStore()
    private var isWorkoutActive = false
    private var currentExercise = ""
    private var currentSet = 0
    private var currentReps = 0
    private var workoutStartTime: Date?
    
    override func awake(withContext context: Any?) {
        super.awake(withContext: context)
        
        setupHealthKit()
        updateDisplay()
    }
    
    override func willActivate() {
        super.willActivate()
        startListeningForUpdates()
    }
    
    override func didDeactivate() {
        super.didDeactivate()
        stopListeningForUpdates()
    }
    
    // MARK: - HealthKit Setup
    
    private func setupHealthKit() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            if success {
                self.startHeartRateMonitoring()
            }
        }
    }
    
    private func startHeartRateMonitoring() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        
        let query = HKAnchoredObjectQuery(type: heartRateType, predicate: nil, anchor: nil, limit: HKObjectQueryNoLimit) { query, samples, deletedObjects, anchor, error in
            self.processHeartRateSamples(samples)
        }
        
        query.updateHandler = { query, samples, deletedObjects, anchor, error in
            self.processHeartRateSamples(samples)
        }
        
        healthStore.execute(query)
    }
    
    private func processHeartRateSamples(_ samples: [HKSample]?) {
        guard let heartRateSamples = samples as? [HKQuantitySample] else { return }
        
        DispatchQueue.main.async {
            if let lastSample = heartRateSamples.last {
                let heartRate = lastSample.quantity.doubleValue(for: HKUnit(from: "count/min"))
                self.heartRateLabel.setText("\(Int(heartRate)) BPM")
            }
        }
    }
    
    // MARK: - Workout Controls
    
    @IBAction func controlButtonTapped() {
        if isWorkoutActive {
            pauseWorkout()
        } else {
            startWorkout()
        }
    }
    
    @IBAction func skipButtonTapped() {
        sendMessageToPhone(type: "skipExercise")
        WKInterfaceDevice.current().play(.click)
    }
    
    @IBAction func completeSetButtonTapped() {
        sendMessageToPhone(type: "completeSet")
        WKInterfaceDevice.current().play(.success)
    }
    
    @IBAction func emergencyButtonTapped() {
        let alert = WKAlertAction(title: "Stop Workout", style: .destructive) {
            self.emergencyStopWorkout()
        }
        presentAlert(withTitle: "Emergency Stop", message: "Are you sure you want to stop the workout?", preferredStyle: .alert, actions: [alert])
    }
    
    private func startWorkout() {
        isWorkoutActive = true
        workoutStartTime = Date()
        updateDisplay()
        sendMessageToPhone(type: "startWorkout")
        WKInterfaceDevice.current().play(.start)
    }
    
    private func pauseWorkout() {
        isWorkoutActive = false
        updateDisplay()
        sendMessageToPhone(type: "pauseWorkout")
        WKInterfaceDevice.current().play(.stop)
    }
    
    private func emergencyStopWorkout() {
        isWorkoutActive = false
        updateDisplay()
        sendMessageToPhone(type: "emergencyStopWorkout")
        WKInterfaceDevice.current().play(.failure)
    }
    
    // MARK: - Quick Logging
    
    @IBAction func logWaterIntake() {
        presentTextInputController(withSuggestions: ["250ml", "500ml", "750ml", "1L"], allowedInputMode: .allowAnimatedEmoji) { results in
            if let result = results?.first as? String {
                self.sendMessageToPhone(type: "logWater", data: ["amount": result])
                WKInterfaceDevice.current().play(.success)
            }
        }
    }
    
    @IBAction func logWeight() {
        presentTextInputController(withSuggestions: nil, allowedInputMode: .allowAnimatedEmoji) { results in
            if let result = results?.first as? String {
                self.sendMessageToPhone(type: "logWeight", data: ["weight": result])
                WKInterfaceDevice.current().play(.success)
            }
        }
    }
    
    @IBAction func logMood() {
        let moodOptions = ["😢 1", "😕 2", "😐 3", "🙂 4", "😄 5"]
        presentAlert(withTitle: "How are you feeling?", message: nil, preferredStyle: .actionSheet, actions: moodOptions.map { mood in
            WKAlertAction(title: mood, style: .default) {
                let moodValue = String(mood.last!)
                self.sendMessageToPhone(type: "logMood", data: ["mood": moodValue])
                WKInterfaceDevice.current().play(.success)
            }
        })
    }
    
    // MARK: - Set/Rep Input
    
    @IBAction func incrementSet() {
        currentSet += 1
        updateSetRepDisplay()
        sendMessageToPhone(type: "updateSet", data: ["set": currentSet])
        WKInterfaceDevice.current().play(.click)
    }
    
    @IBAction func decrementSet() {
        if currentSet > 0 {
            currentSet -= 1
            updateSetRepDisplay()
            sendMessageToPhone(type: "updateSet", data: ["set": currentSet])
            WKInterfaceDevice.current().play(.click)
        }
    }
    
    @IBAction func incrementReps() {
        currentReps += 1
        updateSetRepDisplay()
        sendMessageToPhone(type: "updateReps", data: ["reps": currentReps])
        WKInterfaceDevice.current().play(.click)
    }
    
    @IBAction func decrementReps() {
        if currentReps > 0 {
            currentReps -= 1
            updateSetRepDisplay()
            sendMessageToPhone(type: "updateReps", data: ["reps": currentReps])
            WKInterfaceDevice.current().play(.click)
        }
    }
    
    private func updateSetRepDisplay() {
        setRepLabel.setText("Set \(currentSet) • \(currentReps) reps")
    }
    
    // MARK: - Display Updates
    
    private func updateDisplay() {
        if isWorkoutActive {
            workoutStatusLabel.setText("Workout Active")
            controlButton.setTitle("Pause")
            controlButton.setBackgroundColor(.orange)
        } else {
            workoutStatusLabel.setText("Workout Paused")
            controlButton.setTitle("Resume")
            controlButton.setBackgroundColor(.green)
        }
        
        updateDuration()
    }
    
    private func updateDuration() {
        guard let startTime = workoutStartTime else { return }
        let duration = Date().timeIntervalSince(startTime)
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        durationLabel.setText(String(format: "%02d:%02d", minutes, seconds))
    }
    
    // MARK: - Communication
    
    private func startListeningForUpdates() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    private func stopListeningForUpdates() {
        // Stop listening
    }
    
    private func sendMessageToPhone(type: String, data: [String: Any] = [:]) {
        guard let session = WCSession.default, session.isReachable else { return }
        
        var message: [String: Any] = ["type": type]
        message.merge(data) { _, new in new }
        
        session.sendMessage(message, replyHandler: nil) { error in
            print("Failed to send message: \(error.localizedDescription)")
        }
    }
}

// MARK: - WCSessionDelegate

extension WorkoutInterfaceController: WCSessionDelegate {
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated {
            print("Watch session activated")
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        DispatchQueue.main.async {
            self.handleMessage(message)
        }
    }
    
    private func handleMessage(_ message: [String: Any]) {
        guard let type = message["type"] as? String else { return }
        
        switch type {
        case "updateExercise":
            if let exercise = message["exercise"] as? String {
                currentExercise = exercise
                workoutStatusLabel.setText(exercise)
            }
            
        case "updateSetReps":
            if let set = message["set"] as? Int {
                currentSet = set
            }
            if let reps = message["reps"] as? Int {
                currentReps = reps
            }
            updateSetRepDisplay()
            
        case "updateCalories":
            if let calories = message["calories"] as? Double {
                caloriesLabel.setText("\(Int(calories)) cal")
            }
            
        case "updateDistance":
            if let distance = message["distance"] as? Double {
                let km = distance / 1000
                distanceLabel.setText(String(format: "%.1f km", km))
            }
            
        default:
            break
        }
    }
} 