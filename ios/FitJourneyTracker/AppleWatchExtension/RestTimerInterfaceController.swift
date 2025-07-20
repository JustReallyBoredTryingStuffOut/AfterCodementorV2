import WatchKit
import Foundation
import UserNotifications

class RestTimerInterfaceController: WKInterfaceController {
    
    @IBOutlet weak var timerLabel: WKInterfaceLabel!
    @IBOutlet weak var statusLabel: WKInterfaceLabel!
    @IBOutlet weak var progressRing: WKInterfaceGroup!
    @IBOutlet weak var countdownLabel: WKInterfaceLabel!
    
    private var timer: Timer?
    private var remainingSeconds: Int = 0
    private var totalSeconds: Int = 0
    private var isCountdownMode: Bool = false
    private var countdownStartSeconds: Int = 10
    
    override func awake(withContext context: Any?) {
        super.awake(withContext: context)
        
        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("Notification permission granted")
            } else {
                print("Notification permission denied")
            }
        }
        
        // Set up initial state
        updateDisplay(time: 0, isActive: false)
    }
    
    override func willActivate() {
        super.willActivate()
        
        // Start listening for rest timer updates from iPhone
        startListeningForUpdates()
    }
    
    override func didDeactivate() {
        super.didDeactivate()
        
        // Stop listening when interface deactivates
        stopListeningForUpdates()
    }
    
    // MARK: - Timer Management
    
    func startRestTimer(seconds: Int) {
        remainingSeconds = seconds
        totalSeconds = seconds
        isCountdownMode = false
        
        // Start the timer
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.updateTimer()
        }
        
        updateDisplay(time: remainingSeconds, isActive: true)
        
        // Haptic feedback for timer start
        WKInterfaceDevice.current().play(.start)
    }
    
    func stopRestTimer() {
        timer?.invalidate()
        timer = nil
        updateDisplay(time: 0, isActive: false)
        
        // Haptic feedback for timer stop
        WKInterfaceDevice.current().play(.stop)
    }
    
    private func updateTimer() {
        remainingSeconds -= 1
        
        // Check if we should enter countdown mode (last 10 seconds)
        if remainingSeconds <= countdownStartSeconds && !isCountdownMode {
            enterCountdownMode()
        }
        
        if remainingSeconds <= 0 {
            timerCompleted()
        } else {
            updateDisplay(time: remainingSeconds, isActive: true)
        }
    }
    
    private func enterCountdownMode() {
        isCountdownMode = true
        
        // Haptic feedback for countdown start
        WKInterfaceDevice.current().play(.notification)
        
        // Start countdown animation
        animateCountdown()
    }
    
    private func animateCountdown() {
        guard isCountdownMode && remainingSeconds > 0 else { return }
        
        // Update countdown label with current number
        countdownLabel.setText("\(remainingSeconds)")
        
        // Animate the countdown number
        animate(withDuration: 0.3) {
            self.countdownLabel.setAlpha(0.3)
        }
        
        animate(withDuration: 0.3) {
            self.countdownLabel.setAlpha(1.0)
        }
        
        // Haptic feedback for each countdown number
        WKInterfaceDevice.current().play(.click)
    }
    
    private func timerCompleted() {
        timer?.invalidate()
        timer = nil
        
        // Final countdown animation
        countdownLabel.setText("0")
        
        // Haptic feedback for completion
        WKInterfaceDevice.current().play(.success)
        
        // Show completion message
        statusLabel.setText("Rest Complete!")
        timerLabel.setText("00:00")
        
        // Send notification
        sendCompletionNotification()
        
        // Auto-hide after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            self.updateDisplay(time: 0, isActive: false)
        }
    }
    
    private func updateDisplay(time: Int, isActive: Bool) {
        let minutes = time / 60
        let seconds = time % 60
        let timeString = String(format: "%02d:%02d", minutes, seconds)
        
        timerLabel.setText(timeString)
        
        if isActive {
            statusLabel.setText("Rest Timer")
            
            // Update progress ring
            let progress = totalSeconds > 0 ? Float(remainingSeconds) / Float(totalSeconds) : 0.0
            updateProgressRing(progress: progress)
            
            // Show countdown label if in countdown mode
            countdownLabel.setHidden(!isCountdownMode)
        } else {
            statusLabel.setText("Ready")
            countdownLabel.setHidden(true)
            updateProgressRing(progress: 0.0)
        }
    }
    
    private func updateProgressRing(progress: Float) {
        // Update the progress ring animation
        let animationDuration = 0.3
        animate(withDuration: animationDuration) {
            // This would update the progress ring visual
            // In a real implementation, you'd have a custom progress ring view
        }
    }
    
    // MARK: - Communication with iPhone
    
    private func startListeningForUpdates() {
        // Listen for WatchConnectivity messages from iPhone
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    private func stopListeningForUpdates() {
        // Stop listening for updates
    }
    
    // MARK: - Notifications
    
    private func sendCompletionNotification() {
        let content = UNMutableNotificationContent()
        content.title = "Rest Complete!"
        content.body = "Time to get back to your workout!"
        content.sound = UNNotificationSound.default
        
        let request = UNNotificationRequest(identifier: "restTimerComplete", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}

// MARK: - WCSessionDelegate

extension RestTimerInterfaceController: WCSessionDelegate {
    
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
        case "startRestTimer":
            if let seconds = message["seconds"] as? Int {
                startRestTimer(seconds: seconds)
            }
            
        case "stopRestTimer":
            stopRestTimer()
            
        case "updateRestTimer":
            if let seconds = message["seconds"] as? Int {
                remainingSeconds = seconds
                updateDisplay(time: remainingSeconds, isActive: true)
            }
            
        default:
            break
        }
    }
} 