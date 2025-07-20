import Foundation
import UserNotifications
import WatchKit

class AppleWatchNotificationService: NSObject {
    
    static let shared = AppleWatchNotificationService()
    
    override init() {
        super.init()
        requestNotificationPermissions()
    }
    
    // MARK: - Notification Permissions
    
    private func requestNotificationPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge, .provisional]) { granted, error in
            if granted {
                print("Notification permissions granted")
            } else {
                print("Notification permissions denied")
            }
        }
    }
    
    // MARK: - Smart Notifications
    
    func scheduleWorkoutReminder(hour: Int, minute: Int, days: [Int] = [1,2,3,4,5,6,7]) {
        let content = UNMutableNotificationContent()
        content.title = "Time to Work Out! 💪"
        content.body = "Your scheduled workout is ready to begin"
        content.sound = UNNotificationSound.default
        content.categoryIdentifier = "WORKOUT_REMINDER"
        
        for day in days {
            var dateComponents = DateComponents()
            dateComponents.hour = hour
            dateComponents.minute = minute
            dateComponents.weekday = day
            
            let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
            let request = UNNotificationRequest(identifier: "workout_reminder_\(day)", content: content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request)
        }
    }
    
    func scheduleHydrationReminder(interval: TimeInterval = 3600) { // Default: 1 hour
        let content = UNMutableNotificationContent()
        content.title = "Stay Hydrated! 💧"
        content.body = "Time to drink some water"
        content.sound = UNNotificationSound.default
        content.categoryIdentifier = "HYDRATION_REMINDER"
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: true)
        let request = UNNotificationRequest(identifier: "hydration_reminder", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    func scheduleRestDaySuggestion() {
        let content = UNMutableNotificationContent()
        content.title = "Rest Day Suggestion 🛌"
        content.body = "Consider taking a rest day today to let your body recover"
        content.sound = UNNotificationSound.default
        content.categoryIdentifier = "REST_DAY_SUGGESTION"
        
        // Schedule for 9 AM
        var dateComponents = DateComponents()
        dateComponents.hour = 9
        dateComponents.minute = 0
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: "rest_day_suggestion", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    func sendAchievementNotification(achievement: String, description: String) {
        let content = UNMutableNotificationContent()
        content.title = "Achievement Unlocked! 🏆"
        content.body = "\(achievement): \(description)"
        content.sound = UNNotificationSound.default
        content.categoryIdentifier = "ACHIEVEMENT"
        
        let request = UNNotificationRequest(identifier: "achievement_\(Date().timeIntervalSince1970)", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
    
    func sendStreakNotification(streakType: String, days: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Streak Alert! 🔥"
        content.body = "You've maintained your \(streakType) streak for \(days) days!"
        content.sound = UNNotificationSound.default
        content.categoryIdentifier = "STREAK_MAINTENANCE"
        
        let request = UNNotificationRequest(identifier: "streak_\(streakType)", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
    
    func sendWorkoutCompletionNotification(duration: String, calories: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Workout Complete! ✅"
        content.body = "Great job! You worked out for \(duration) and burned \(calories) calories"
        content.sound = UNNotificationSound.default
        content.categoryIdentifier = "WORKOUT_COMPLETION"
        
        let request = UNNotificationRequest(identifier: "workout_completion", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
    
    func sendGoalReminderNotification(goalType: String, progress: Int, target: Int) {
        let percentage = Int((Double(progress) / Double(target)) * 100)
        let content = UNMutableNotificationContent()
        content.title = "Goal Progress 📊"
        content.body = "You're \(percentage)% to your \(goalType) goal! Keep going!"
        content.sound = UNNotificationSound.default
        content.categoryIdentifier = "GOAL_REMINDER"
        
        let request = UNNotificationRequest(identifier: "goal_reminder_\(goalType)", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
    
    // MARK: - Notification Categories
    
    func setupNotificationCategories() {
        let workoutReminderCategory = UNNotificationCategory(
            identifier: "WORKOUT_REMINDER",
            actions: [
                UNNotificationAction(identifier: "START_WORKOUT", title: "Start Workout", options: [.foreground]),
                UNNotificationAction(identifier: "SNOOZE", title: "Snooze 15min", options: [])
            ],
            intentIdentifiers: [],
            options: []
        )
        
        let hydrationReminderCategory = UNNotificationCategory(
            identifier: "HYDRATION_REMINDER",
            actions: [
                UNNotificationAction(identifier: "LOG_WATER", title: "Log Water", options: [.foreground]),
                UNNotificationAction(identifier: "DISMISS", title: "Dismiss", options: [])
            ],
            intentIdentifiers: [],
            options: []
        )
        
        let achievementCategory = UNNotificationCategory(
            identifier: "ACHIEVEMENT",
            actions: [
                UNNotificationAction(identifier: "VIEW_ACHIEVEMENT", title: "View", options: [.foreground]),
                UNNotificationAction(identifier: "SHARE", title: "Share", options: [])
            ],
            intentIdentifiers: [],
            options: []
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([
            workoutReminderCategory,
            hydrationReminderCategory,
            achievementCategory
        ])
    }
    
    // MARK: - Notification Management
    
    func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
    
    func cancelNotification(identifier: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
    }
    
    func getPendingNotifications(completion: @escaping ([UNNotificationRequest]) -> Void) {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            completion(requests)
        }
    }
    
    // MARK: - Smart Scheduling
    
    func scheduleSmartNotifications() {
        // Schedule workout reminders based on user's typical workout time
        scheduleWorkoutReminder(hour: 6, minute: 0) // 6 AM
        
        // Schedule hydration reminders every 2 hours
        scheduleHydrationReminder(interval: 7200) // 2 hours
        
        // Schedule rest day suggestions
        scheduleRestDaySuggestion()
    }
    
    // MARK: - Contextual Notifications
    
    func sendContextualNotification(context: String, message: String) {
        let content = UNMutableNotificationContent()
        content.title = context
        content.body = message
        content.sound = UNNotificationSound.default
        
        let request = UNNotificationRequest(identifier: "contextual_\(Date().timeIntervalSince1970)", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
} 