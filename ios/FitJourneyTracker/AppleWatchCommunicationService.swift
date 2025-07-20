import Foundation
import WatchConnectivity
import AVFoundation

class AppleWatchCommunicationService: NSObject {
    
    static let shared = AppleWatchCommunicationService()
    
    private var session: WCSession?
    private var speechSynthesizer = AVSpeechSynthesizer()
    
    override init() {
        super.init()
        setupWatchConnectivity()
    }
    
    // MARK: - Watch Connectivity Setup
    
    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }
    
    // MARK: - Rest Timer Commands (Existing)
    
    func startRestTimerOnWatch(seconds: Int) {
        guard let session = session, session.isReachable else {
            print("Apple Watch is not reachable")
            return
        }
        
        let message: [String: Any] = [
            "type": "startRestTimer",
            "seconds": seconds
        ]
        
        session.sendMessage(message, replyHandler: { reply in
            print("Rest timer started on Apple Watch")
        }, errorHandler: { error in
            print("Failed to start rest timer on Apple Watch: \(error.localizedDescription)")
        })
    }
    
    func stopRestTimerOnWatch() {
        guard let session = session, session.isReachable else {
            print("Apple Watch is not reachable")
            return
        }
        
        let message: [String: Any] = [
            "type": "stopRestTimer"
        ]
        
        session.sendMessage(message, replyHandler: { reply in
            print("Rest timer stopped on Apple Watch")
        }, errorHandler: { error in
            print("Failed to stop rest timer on Apple Watch: \(error.localizedDescription)")
        })
    }
    
    func updateRestTimerOnWatch(seconds: Int) {
        guard let session = session, session.isReachable else {
            print("Apple Watch is not reachable")
            return
        }
        
        let message: [String: Any] = [
            "type": "updateRestTimer",
            "seconds": seconds
        ]
        
        session.sendMessage(message, replyHandler: { reply in
            print("Rest timer updated on Apple Watch")
        }, errorHandler: { error in
            print("Failed to update rest timer on Apple Watch: \(error.localizedDescription)")
        })
    }
    
    // MARK: - Workout Controls
    
    func sendWorkoutCommand(type: String, data: [String: Any] = [:]) {
        guard let session = session, session.isReachable else {
            print("Apple Watch is not reachable")
            return
        }
        
        var message: [String: Any] = ["type": type]
        message.merge(data) { _, new in new }
        
        session.sendMessage(message, replyHandler: { reply in
            print("Workout command sent to Apple Watch: \(type)")
        }, errorHandler: { error in
            print("Failed to send workout command to Apple Watch: \(error.localizedDescription)")
        })
    }
    
    // MARK: - Quick Logging
    
    func sendQuickLog(type: String, data: [String: Any] = [:]) {
        guard let session = session, session.isReachable else {
            print("Apple Watch is not reachable")
            return
        }
        
        var message: [String: Any] = ["type": type]
        message.merge(data) { _, new in new }
        
        session.sendMessage(message, replyHandler: { reply in
            print("Quick log sent to Apple Watch: \(type)")
        }, errorHandler: { error in
            print("Failed to send quick log to Apple Watch: \(error.localizedDescription)")
        })
    }
    
    // MARK: - Voice Announcements (Existing)
    
    func announceRestComplete() {
        let utterance = AVSpeechUtterance(string: "Rest over")
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.5
        utterance.pitchMultiplier = 1.2
        utterance.volume = 0.8
        
        speechSynthesizer.speak(utterance)
    }
    
    func announceRestStart(seconds: Int) {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        
        var announcement = ""
        if minutes > 0 {
            announcement = "Rest timer started. \(minutes) minute"
            if minutes > 1 {
                announcement += "s"
            }
            if remainingSeconds > 0 {
                announcement += " and \(remainingSeconds) second"
                if remainingSeconds > 1 {
                    announcement += "s"
                }
            }
        } else {
            announcement = "Rest timer started. \(remainingSeconds) second"
            if remainingSeconds > 1 {
                announcement += "s"
            }
        }
        
        let utterance = AVSpeechUtterance(string: announcement)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.4
        utterance.pitchMultiplier = 1.1
        utterance.volume = 0.7
        
        speechSynthesizer.speak(utterance)
    }
    
    func announceCountdown(seconds: Int) {
        let utterance = AVSpeechUtterance(string: "\(seconds)")
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.3
        utterance.pitchMultiplier = 1.3
        utterance.volume = 0.9
        
        speechSynthesizer.speak(utterance)
    }
    
    // MARK: - Watch Status (Existing)
    
    func isAppleWatchReachable() -> Bool {
        return session?.isReachable ?? false
    }
    
    func getAppleWatchStatus() -> String {
        guard let session = session else {
            return "Watch Connectivity not supported"
        }
        
        if session.isReachable {
            return "Apple Watch connected"
        } else {
            return "Apple Watch not reachable"
        }
    }
}

// MARK: - WCSessionDelegate

extension AppleWatchCommunicationService: WCSessionDelegate {
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated {
            print("iPhone session activated")
        } else if let error = error {
            print("iPhone session activation failed: \(error.localizedDescription)")
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
        case "restTimerCompleted":
            // Apple Watch notified that rest timer completed
            announceRestComplete()
            
        case "restTimerCountdown":
            if let seconds = message["seconds"] as? Int {
                announceCountdown(seconds: seconds)
            }
            
        case "workoutControl":
            // Handle workout control messages from Apple Watch
            if let controlType = message["controlType"] as? String {
                handleWorkoutControl(controlType: controlType, data: message)
            }
            
        case "quickLogging":
            // Handle quick logging messages from Apple Watch
            if let logType = message["logType"] as? String {
                handleQuickLogging(logType: logType, data: message)
            }
            
        default:
            break
        }
    }
    
    private func handleWorkoutControl(controlType: String, data: [String: Any]) {
        switch controlType {
        case "startWorkout":
            print("Apple Watch requested workout start")
            // Emit event to React Native
            
        case "pauseWorkout":
            print("Apple Watch requested workout pause")
            // Emit event to React Native
            
        case "skipExercise":
            print("Apple Watch requested exercise skip")
            // Emit event to React Native
            
        case "completeSet":
            print("Apple Watch marked set as complete")
            // Emit event to React Native
            
        case "emergencyStopWorkout":
            print("Apple Watch requested emergency workout stop")
            // Emit event to React Native
            
        default:
            break
        }
    }
    
    private func handleQuickLogging(logType: String, data: [String: Any]) {
        switch logType {
        case "logWater":
            if let amount = data["amount"] as? String {
                print("Apple Watch logged water: \(amount)")
                // Emit event to React Native
            }
            
        case "logWeight":
            if let weight = data["weight"] as? Double {
                print("Apple Watch logged weight: \(weight)")
                // Emit event to React Native
            }
            
        case "logMood":
            if let mood = data["mood"] as? String, let description = data["description"] as? String {
                print("Apple Watch logged mood: \(mood) - \(description)")
                // Emit event to React Native
            }
            
        default:
            break
        }
    }
    
    #if os(iOS)
    func sessionDidBecomeInactive(_ session: WCSession) {
        print("iPhone session became inactive")
    }
    
    func sessionDidDeactivate(_ session: WCSession) {
        print("iPhone session deactivated")
        // Reactivate for future use
        WCSession.default.activate()
    }
    #endif
} 