import WatchKit
import Foundation
import UserNotifications

class QuickLoggingInterfaceController: WKInterfaceController {
    
    @IBOutlet weak var waterButton: WKInterfaceButton!
    @IBOutlet weak var weightButton: WKInterfaceButton!
    @IBOutlet weak var moodButton: WKInterfaceButton!
    @IBOutlet weak var statusLabel: WKInterfaceLabel!
    
    override func awake(withContext context: Any?) {
        super.awake(withContext: context)
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
    
    // MARK: - Quick Logging Actions
    
    @IBAction func logWaterIntake() {
        let waterOptions = ["250ml", "500ml", "750ml", "1L", "Custom"]
        
        presentAlert(withTitle: "Log Water Intake", message: "Select amount:", preferredStyle: .actionSheet, actions: waterOptions.map { amount in
            WKAlertAction(title: amount, style: .default) {
                if amount == "Custom" {
                    self.showCustomWaterInput()
                } else {
                    self.sendWaterLog(amount: amount)
                }
            }
        })
    }
    
    @IBAction func logWeight() {
        showCustomWeightInput()
    }
    
    @IBAction func logMood() {
        let moodOptions = [
            ("😢", "1", "Very Bad"),
            ("😕", "2", "Bad"),
            ("😐", "3", "Okay"),
            ("🙂", "4", "Good"),
            ("😄", "5", "Great")
        ]
        
        presentAlert(withTitle: "How are you feeling?", message: "Select your mood:", preferredStyle: .actionSheet, actions: moodOptions.map { emoji, value, description in
            WKAlertAction(title: "\(emoji) \(description)", style: .default) {
                self.sendMoodLog(mood: value, description: description)
            }
        })
    }
    
    // MARK: - Custom Input Methods
    
    private func showCustomWaterInput() {
        presentTextInputController(withSuggestions: ["100ml", "200ml", "300ml", "400ml"], allowedInputMode: .allowAnimatedEmoji) { results in
            if let result = results?.first as? String {
                self.sendWaterLog(amount: result)
            }
        }
    }
    
    private func showCustomWeightInput() {
        presentTextInputController(withSuggestions: nil, allowedInputMode: .allowAnimatedEmoji) { results in
            if let result = results?.first as? String {
                // Validate weight input
                if let weight = Double(result), weight > 0 && weight < 1000 {
                    self.sendWeightLog(weight: weight)
                } else {
                    self.showErrorAlert(message: "Please enter a valid weight (e.g., 75.5)")
                }
            }
        }
    }
    
    // MARK: - Send Logs to iPhone
    
    private func sendWaterLog(amount: String) {
        sendMessageToPhone(type: "logWater", data: ["amount": amount])
        showSuccessMessage("Water logged: \(amount)")
        WKInterfaceDevice.current().play(.success)
    }
    
    private func sendWeightLog(weight: Double) {
        sendMessageToPhone(type: "logWeight", data: ["weight": weight])
        showSuccessMessage("Weight logged: \(weight)kg")
        WKInterfaceDevice.current().play(.success)
    }
    
    private func sendMoodLog(mood: String, description: String) {
        sendMessageToPhone(type: "logMood", data: ["mood": mood, "description": description])
        showSuccessMessage("Mood logged: \(description)")
        WKInterfaceDevice.current().play(.success)
    }
    
    // MARK: - UI Updates
    
    private func updateDisplay() {
        waterButton.setTitle("💧 Log Water")
        weightButton.setTitle("⚖️ Log Weight")
        moodButton.setTitle("😊 Log Mood")
        statusLabel.setText("Quick Logging")
    }
    
    private func showSuccessMessage(_ message: String) {
        statusLabel.setText(message)
        
        // Auto-reset after 2 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.statusLabel.setText("Quick Logging")
        }
    }
    
    private func showErrorAlert(message: String) {
        let alert = WKAlertAction(title: "OK", style: .default) {}
        presentAlert(withTitle: "Error", message: message, preferredStyle: .alert, actions: [alert])
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
        
        session.sendMessage(message, replyHandler: { reply in
            print("Message sent successfully")
        }, errorHandler: { error in
            print("Failed to send message: \(error.localizedDescription)")
        })
    }
}

// MARK: - WCSessionDelegate

extension QuickLoggingInterfaceController: WCSessionDelegate {
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated {
            print("Quick logging session activated")
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
        case "loggingSuccess":
            if let logType = message["logType"] as? String {
                showSuccessMessage("\(logType) logged successfully!")
            }
            
        case "loggingError":
            if let errorMessage = message["error"] as? String {
                showErrorAlert(message: errorMessage)
            }
            
        default:
            break
        }
    }
} 