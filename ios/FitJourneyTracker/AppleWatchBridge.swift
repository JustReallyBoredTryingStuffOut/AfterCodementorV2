import Foundation
import React

@objc(AppleWatchBridge)
class AppleWatchBridge: RCTEventEmitter {
    
    private let communicationService = AppleWatchCommunicationService.shared
    private let notificationService = AppleWatchNotificationService.shared
    
    override init() {
        super.init()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return [
            "restTimerCompleted", 
            "restTimerCountdown", 
            "watchStatusChanged",
            "workoutControl",
            "quickLogging",
            "notificationReceived"
        ]
    }
    
    // MARK: - Rest Timer Commands (Existing)
    
    @objc
    func startRestTimerOnWatch(_ seconds: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let secondsInt = seconds.intValue
        
        DispatchQueue.main.async {
            self.communicationService.startRestTimerOnWatch(seconds: secondsInt)
            self.communicationService.announceRestStart(seconds: secondsInt)
            resolve(["success": true])
        }
    }
    
    @objc
    func stopRestTimerOnWatch(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.stopRestTimerOnWatch()
            resolve(["success": true])
        }
    }
    
    @objc
    func updateRestTimerOnWatch(_ seconds: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let secondsInt = seconds.intValue
        
        DispatchQueue.main.async {
            self.communicationService.updateRestTimerOnWatch(seconds: secondsInt)
            resolve(["success": true])
        }
    }
    
    // MARK: - Workout Controls
    
    @objc
    func startWorkoutOnWatch(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.sendWorkoutCommand(type: "startWorkout")
            resolve(["success": true])
        }
    }
    
    @objc
    func pauseWorkoutOnWatch(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.sendWorkoutCommand(type: "pauseWorkout")
            resolve(["success": true])
        }
    }
    
    @objc
    func skipExerciseOnWatch(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.sendWorkoutCommand(type: "skipExercise")
            resolve(["success": true])
        }
    }
    
    @objc
    func completeSetOnWatch(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.sendWorkoutCommand(type: "completeSet")
            resolve(["success": true])
        }
    }
    
    @objc
    func emergencyStopWorkoutOnWatch(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.sendWorkoutCommand(type: "emergencyStopWorkout")
            resolve(["success": true])
        }
    }
    
    // MARK: - Quick Logging
    
    @objc
    func logWaterOnWatch(_ amount: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.sendQuickLog(type: "logWater", data: ["amount": amount])
            resolve(["success": true])
        }
    }
    
    @objc
    func logWeightOnWatch(_ weight: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.sendQuickLog(type: "logWeight", data: ["weight": weight.doubleValue])
            resolve(["success": true])
        }
    }
    
    @objc
    func logMoodOnWatch(_ mood: String, description: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.sendQuickLog(type: "logMood", data: ["mood": mood, "description": description])
            resolve(["success": true])
        }
    }
    
    // MARK: - Smart Notifications
    
    @objc
    func scheduleWorkoutReminder(_ hour: NSNumber, minute: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.notificationService.scheduleWorkoutReminder(hour: hour.intValue, minute: minute.intValue)
            resolve(["success": true])
        }
    }
    
    @objc
    func scheduleHydrationReminder(_ interval: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.notificationService.scheduleHydrationReminder(interval: interval.doubleValue)
            resolve(["success": true])
        }
    }
    
    @objc
    func sendAchievementNotification(_ achievement: String, description: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.notificationService.sendAchievementNotification(achievement: achievement, description: description)
            resolve(["success": true])
        }
    }
    
    @objc
    func sendStreakNotification(_ streakType: String, days: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.notificationService.sendStreakNotification(streakType: streakType, days: days.intValue)
            resolve(["success": true])
        }
    }
    
    @objc
    func sendWorkoutCompletionNotification(_ duration: String, calories: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.notificationService.sendWorkoutCompletionNotification(duration: duration, calories: calories.intValue)
            resolve(["success": true])
        }
    }
    
    // MARK: - Watch Status (Existing)
    
    @objc
    func isAppleWatchReachable(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let isReachable = communicationService.isAppleWatchReachable()
        resolve(["isReachable": isReachable])
    }
    
    @objc
    func getAppleWatchStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let status = communicationService.getAppleWatchStatus()
        resolve(["status": status])
    }
    
    // MARK: - Voice Announcements (Existing)
    
    @objc
    func announceRestComplete(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.communicationService.announceRestComplete()
            resolve(["success": true])
        }
    }
    
    @objc
    func announceCountdown(_ seconds: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let secondsInt = seconds.intValue
        
        DispatchQueue.main.async {
            self.communicationService.announceCountdown(seconds: secondsInt)
            resolve(["success": true])
        }
    }
    
    // MARK: - Event Emission
    
    func emitRestTimerCompleted() {
        sendEvent(withName: "restTimerCompleted", body: ["completed": true])
    }
    
    func emitRestTimerCountdown(seconds: Int) {
        sendEvent(withName: "restTimerCountdown", body: ["seconds": seconds])
    }
    
    func emitWatchStatusChanged(isReachable: Bool) {
        sendEvent(withName: "watchStatusChanged", body: ["isReachable": isReachable])
    }
    
    func emitWorkoutControl(type: String, data: [String: Any] = [:]) {
        var eventData: [String: Any] = ["type": type]
        eventData.merge(data) { _, new in new }
        sendEvent(withName: "workoutControl", body: eventData)
    }
    
    func emitQuickLogging(type: String, data: [String: Any] = [:]) {
        var eventData: [String: Any] = ["type": type]
        eventData.merge(data) { _, new in new }
        sendEvent(withName: "quickLogging", body: eventData)
    }
    
    func emitNotificationReceived(notificationType: String, data: [String: Any] = [:]) {
        var eventData: [String: Any] = ["notificationType": notificationType]
        eventData.merge(data) { _, new in new }
        sendEvent(withName: "notificationReceived", body: eventData)
    }
} 