import Foundation
import HealthKit
import React

@objc(HealthKitModule)
class HealthKitModule: NSObject, RCTBridgeModule {
    private let healthStore = HKHealthStore()

    static func moduleName() -> String! {
        return "HealthKitModule"
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    func isHealthDataAvailable(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        resolve(HKHealthStore.isHealthDataAvailable())
    }

    @objc
    func requestAuthorization(_ dataTypes: NSArray?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        var typesToRead: Set<HKObjectType> = []
        var typesToWrite: Set<HKSampleType> = []
        
        // Convert string data types to HealthKit types
        if let dataTypes = dataTypes as? [String] {
            for dataType in dataTypes {
                switch dataType {
                case "steps":
                    if let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) {
                        typesToRead.insert(stepType)
                    }
                case "distance":
                    if let distanceType = HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning) {
                        typesToRead.insert(distanceType)
                    }
                case "calories":
                    if let calorieType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
                        typesToRead.insert(calorieType)
                    }
                case "heartRate":
                    if let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) {
                        typesToRead.insert(heartRateType)
                    }
                case "sleep":
                    if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
                        typesToRead.insert(sleepType)
                    }
                case "workouts":
                    let workoutType = HKObjectType.workoutType()
                    typesToRead.insert(workoutType)
                case "weight":
                    if let weightType = HKObjectType.quantityType(forIdentifier: .bodyMass) {
                        typesToRead.insert(weightType)
                        typesToWrite.insert(weightType)
                    }
                case "bodyMass":
                    if let bodyMassType = HKObjectType.quantityType(forIdentifier: .bodyMass) {
                        typesToRead.insert(bodyMassType)
                        typesToWrite.insert(bodyMassType)
                    }
                case "bodyFat":
                    if let bodyFatType = HKObjectType.quantityType(forIdentifier: .bodyFatPercentage) {
                        typesToRead.insert(bodyFatType)
                        typesToWrite.insert(bodyFatType)
                    }
                case "muscleMass":
                    if let muscleMassType = HKObjectType.quantityType(forIdentifier: .leanBodyMass) {
                        typesToRead.insert(muscleMassType)
                        typesToWrite.insert(muscleMassType)
                    }
                default:
                    break
                }
            }
        }
        
        // If no specific types requested, add common ones
        if typesToRead.isEmpty {
            if let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) {
                typesToRead.insert(stepType)
            }
            if let distanceType = HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning) {
                typesToRead.insert(distanceType)
            }
            if let calorieType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
                typesToRead.insert(calorieType)
            }
        }
        
        healthStore.requestAuthorization(toShare: typesToWrite, read: typesToRead) { (success, error) in
            if let error = error {
                reject("E_AUTH", error.localizedDescription, error)
            } else {
                let result: [String: Any] = [
                    "authorized": success,
                    "dataTypes": dataTypes ?? ["steps", "distance", "calories", "heartRate", "sleep", "workouts", "weight"]
                ]
                resolve(result)
            }
        }
    }

    @objc
    func getStepCount(_ startDateStr: String, endDateStr: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateStr), let endDate = dateFormatter.date(from: endDateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])
        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            if let error = error {
                reject("E_QUERY", error.localizedDescription, error)
                return
            }
            let steps = result?.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0
            resolve(["success": true, "steps": steps])
        }
        healthStore.execute(query)
    }
    
    @objc
    func getDistanceWalking(_ startDateStr: String, endDateStr: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateStr), let endDate = dateFormatter.date(from: endDateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])
        let query = HKStatisticsQuery(quantityType: distanceType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            if let error = error {
                reject("E_QUERY", error.localizedDescription, error)
                return
            }
            let distance = result?.sumQuantity()?.doubleValue(for: HKUnit.meter()) ?? 0
            let distanceKm = distance / 1000.0
            resolve(["success": true, "distance": distanceKm])
        }
        healthStore.execute(query)
    }
    
    @objc
    func getActiveEnergyBurned(_ startDateStr: String, endDateStr: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateStr), let endDate = dateFormatter.date(from: endDateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        let calorieType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])
        let query = HKStatisticsQuery(quantityType: calorieType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            if let error = error {
                reject("E_QUERY", error.localizedDescription, error)
                return
            }
            let calories = result?.sumQuantity()?.doubleValue(for: HKUnit.kilocalorie()) ?? 0
            resolve(["success": true, "calories": calories])
        }
        healthStore.execute(query)
    }
    
    @objc
    func getHeartRateSamples(_ startDateStr: String, endDateStr: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateStr), let endDate = dateFormatter.date(from: endDateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])
        let query = HKSampleQuery(sampleType: heartRateType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
            if let error = error {
                reject("E_QUERY", error.localizedDescription, error)
                return
            }
            
            let heartRateSamples = samples?.compactMap { sample -> [String: Any]? in
                guard let quantitySample = sample as? HKQuantitySample else { return nil }
                return [
                    "value": quantitySample.quantity.doubleValue(for: HKUnit(from: "count/min")),
                    "startDate": ISO8601DateFormatter().string(from: quantitySample.startDate),
                    "endDate": ISO8601DateFormatter().string(from: quantitySample.endDate),
                    "source": quantitySample.sourceRevision.source.name
                ]
            } ?? []
            
            resolve(["success": true, "samples": heartRateSamples])
        }
        healthStore.execute(query)
    }
    
    @objc
    func getSleepAnalysis(_ startDateStr: String, endDateStr: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateStr), let endDate = dateFormatter.date(from: endDateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
            if let error = error {
                reject("E_QUERY", error.localizedDescription, error)
                return
            }
            
            var sleepData: [String: Double] = [
                "inBed": 0,
                "asleep": 0,
                "awake": 0,
                "deep": 0,
                "rem": 0,
                "light": 0
            ]
            
            if let samples = samples {
                for sample in samples {
                    guard let categorySample = sample as? HKCategorySample else { continue }
                    let duration = sample.endDate.timeIntervalSince(sample.startDate) / 60.0 // Convert to minutes
                    
                    switch categorySample.value {
                    case HKCategoryValueSleepAnalysis.inBed.rawValue:
                        sleepData["inBed"]! += duration
                    case HKCategoryValueSleepAnalysis.asleep.rawValue:
                        sleepData["asleep"]! += duration
                    case HKCategoryValueSleepAnalysis.awake.rawValue:
                        sleepData["awake"]! += duration
                    default:
                        break
                    }
                }
            }
            
            resolve(["success": true, "sleepData": sleepData])
        }
        healthStore.execute(query)
    }
    
    @objc
    func getWorkouts(_ startDateStr: String, endDateStr: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateStr), let endDate = dateFormatter.date(from: endDateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        let workoutType = HKObjectType.workoutType()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])
        let query = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
            if let error = error {
                reject("E_QUERY", error.localizedDescription, error)
                return
            }
            
            let workouts = samples?.compactMap { sample -> [String: Any]? in
                guard let workout = sample as? HKWorkout else { return nil }
                return [
                    "type": workout.workoutActivityType.rawValue,
                    "startDate": ISO8601DateFormatter().string(from: workout.startDate),
                    "endDate": ISO8601DateFormatter().string(from: workout.endDate),
                    "duration": workout.duration,
                    "distance": workout.totalDistance?.doubleValue(for: HKUnit.meter()) ?? 0,
                    "energyBurned": workout.totalEnergyBurned?.doubleValue(for: HKUnit.kilocalorie()) ?? 0
                ]
            } ?? []
            
            resolve(["success": true, "workouts": workouts])
        }
        healthStore.execute(query)
    }
    
    @objc
    func getBodyMass(_ startDateStr: String, endDateStr: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateStr), let endDate = dateFormatter.date(from: endDateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        let bodyMassType = HKQuantityType.quantityType(forIdentifier: .bodyMass)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])
        let query = HKSampleQuery(sampleType: bodyMassType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, error in
            if let error = error {
                reject("E_QUERY", error.localizedDescription, error)
                return
            }
            
            let weightSamples = samples?.compactMap { sample -> [String: Any]? in
                guard let quantitySample = sample as? HKQuantitySample else { return nil }
                return [
                    "value": quantitySample.quantity.doubleValue(for: HKUnit.gramUnit(with: .kilo)),
                    "startDate": ISO8601DateFormatter().string(from: quantitySample.startDate),
                    "endDate": ISO8601DateFormatter().string(from: quantitySample.endDate),
                    "source": quantitySample.sourceRevision.source.name
                ]
            } ?? []
            
            resolve(["success": true, "samples": weightSamples])
        }
        healthStore.execute(query)
    }
    
    @objc
    func writeBodyMass(_ weight: Double, dateStr: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let date = dateFormatter.date(from: dateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        
        let bodyMassType = HKQuantityType.quantityType(forIdentifier: .bodyMass)!
        let weightQuantity = HKQuantity(unit: HKUnit.gramUnit(with: .kilo), doubleValue: weight)
        let weightSample = HKQuantitySample(type: bodyMassType, quantity: weightQuantity, start: date, end: date)
        
        healthStore.save(weightSample) { success, error in
            if let error = error {
                reject("E_WRITE", error.localizedDescription, error)
            } else {
                resolve(["success": success])
            }
        }
    }
    
    @objc
    func observeStepCount(_ callback: @escaping RCTResponseSenderBlock) {
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let query = HKObserverQuery(sampleType: stepType, predicate: nil) { _, _, error in
            if error == nil {
                // Get the latest step count
                let now = Date()
                let startOfDay = Calendar.current.startOfDay(for: now)
                let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: [])
                let statisticsQuery = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
                    let steps = result?.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0
                    callback([["success": true, "steps": steps]])
                }
                self.healthStore.execute(statisticsQuery)
            }
        }
        healthStore.execute(query)
    }
    
    @objc
    func writeWorkout(_ workoutType: Int, startDateStr: String, endDateStr: String, totalEnergyBurned: Double, totalDistance: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateStr), let endDate = dateFormatter.date(from: endDateStr) else {
            reject("E_DATE", "Invalid date format", nil)
            return
        }
        
        let activityType = HKWorkoutActivityType(rawValue: UInt(workoutType)) ?? .other
        let energyBurned = HKQuantity(unit: HKUnit.kilocalorie(), doubleValue: totalEnergyBurned)
        let distance = HKQuantity(unit: HKUnit.meter(), doubleValue: totalDistance)
        
        let workout = HKWorkout(activityType: activityType, start: startDate, end: endDate, duration: endDate.timeIntervalSince(startDate), totalEnergyBurned: energyBurned, totalDistance: distance, metadata: nil)
        
        healthStore.save(workout) { success, error in
            if let error = error {
                reject("E_WRITE", error.localizedDescription, error)
            } else {
                resolve(["success": success])
            }
        }
    }
    
    @objc
    func getBiologicalSex(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        do {
            let biologicalSex = try healthStore.biologicalSex()
            let sexString: String
            switch biologicalSex.biologicalSex {
            case .female:
                sexString = "female"
            case .male:
                sexString = "male"
            case .other:
                sexString = "other"
            default:
                sexString = "notSet"
            }
            resolve(sexString)
        } catch {
            reject("E_QUERY", error.localizedDescription, error)
        }
    }
    
    @objc
    func getDateOfBirth(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        do {
            let dateOfBirth = try healthStore.dateOfBirthComponents()
            if let date = Calendar.current.date(from: dateOfBirth) {
                resolve(ISO8601DateFormatter().string(from: date))
            } else {
                reject("E_QUERY", "Could not parse date of birth", nil)
            }
        } catch {
            reject("E_QUERY", error.localizedDescription, error)
        }
    }
} 