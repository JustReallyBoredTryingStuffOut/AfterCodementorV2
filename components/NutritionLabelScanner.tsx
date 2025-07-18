import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform, Alert, Modal, Pressable, TextInput, ScrollView } from "react-native";
import { Camera, ArrowLeft, X, Edit3, Save, Info } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { colors } from "@/constants/colors";
import Button from "@/components/Button";

// Custom scanning frame icon component
const ScanningFrameIcon = ({ size = 64, color = colors.primary, style }: { size?: number, color?: string, style?: any }) => {
  const strokeWidth = Math.max(2, size / 32);
  const cornerLength = size * 0.2;
  const centerLineLength = size * 0.6;
  
  return (
    <View style={[{ width: size, height: size }, style]}>
      {/* Top-left corner */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: cornerLength,
        height: strokeWidth,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: strokeWidth,
        height: cornerLength,
        backgroundColor: color,
      }} />
      
      {/* Top-right corner */}
      <View style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: cornerLength,
        height: strokeWidth,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: strokeWidth,
        height: cornerLength,
        backgroundColor: color,
      }} />
      
      {/* Bottom-left corner */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: cornerLength,
        height: strokeWidth,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: strokeWidth,
        height: cornerLength,
        backgroundColor: color,
      }} />
      
      {/* Bottom-right corner */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: cornerLength,
        height: strokeWidth,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: strokeWidth,
        height: cornerLength,
        backgroundColor: color,
      }} />
      
      {/* Center horizontal line */}
      <View style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: centerLineLength,
        height: strokeWidth,
        backgroundColor: color,
        transform: [{ translateX: -centerLineLength / 2 }, { translateY: -strokeWidth / 2 }],
      }} />
    </View>
  );
};

type NutritionLabelScannerProps = {
  onNutritionScanned: (nutrition: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: string;
    servingSize: string;
  }) => void;
  onCancel: () => void;
};

export default function NutritionLabelScanner({ onNutritionScanned, onCancel }: NutritionLabelScannerProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    calculationDetails?: {
      rawExtraction: string;
      processingSteps: string[];
      confidence: string;
      adjustments: string[];
    };
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [servingSize, setServingSize] = useState("");
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editedResult, setEditedResult] = useState<{
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    quantity: string;
    servingSize: string;
  }>({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    quantity: "1",
    servingSize: "",
  });
  
  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera and photo library permissions to use this feature.",
          [{ text: "OK" }]
        );
        return false;
      }
    }
    return true;
  };
  
  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
      
      // For demo purposes, use a placeholder image if camera fails
      if (Platform.OS === "web") {
        setPhoto("https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
      }
    }
  };
  
  const handleChooseFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
      
      // For demo purposes, use a placeholder image if gallery fails
      if (Platform.OS === "web") {
        setPhoto("https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
      }
    }
  };
  
  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      if (Platform.OS === "web") {
        // For web, fetch the image and convert to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
              const base64 = reader.result.split(",")[1];
              resolve(base64);
            } else {
              reject(new Error("Failed to convert image to base64"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // For native platforms, use expo-file-system
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  };
  
  const handleScanLabel = async () => {
    if (!photo) return;
    
    setIsScanning(true);
    setScanError(null);
    
    try {
      // Convert the image to base64
      const base64Image = await convertImageToBase64(photo);
      
      // Create a prompt specifically for nutrition label OCR
      const messages = [
        {
          role: "system",
          content: "You are a nutrition label OCR expert. Extract nutritional information from nutrition facts labels and explain your process. Look for serving size, calories, protein, carbs, and fat. Provide a detailed JSON response with these fields: name (string), calories (number), protein (number), carbs (number), fat (number), rawExtraction (string describing what you saw on the label), processingSteps (array of strings explaining each step), confidence (string describing accuracy), adjustments (array of strings explaining any estimates or corrections made). Be specific about what values you found and how you processed them."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the nutrition information from this nutrition facts label image. Focus on calories, protein, carbs, and fat per serving." },
            { type: "image", image: base64Image }
          ]
        }
      ];
      
      // Send the request to the AI API
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Parse the AI response
      try {
        // The AI might return a string that contains JSON or a direct JSON object
        let nutritionData;
        if (typeof data.completion === "string") {
          // Try to extract JSON from the string if it's wrapped in text
          const jsonMatch = data.completion.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            nutritionData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not extract JSON from AI response");
          }
        } else {
          nutritionData = data.completion;
        }
        
        // Validate the nutrition data
        if (!nutritionData.name || 
            typeof nutritionData.calories !== "number" || 
            typeof nutritionData.protein !== "number" || 
            typeof nutritionData.carbs !== "number" || 
            typeof nutritionData.fat !== "number") {
          throw new Error("Invalid nutrition data format");
        }
        
        setScanResult({
          name: nutritionData.name,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fat: nutritionData.fat,
          calculationDetails: {
            rawExtraction: nutritionData.rawExtraction || "No raw extraction details provided",
            processingSteps: nutritionData.processingSteps || ["OCR processing completed"],
            confidence: nutritionData.confidence || "Standard confidence level",
            adjustments: nutritionData.adjustments || ["No adjustments made"],
          },
        });
        
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        setScanError("Failed to parse nutrition information. Please try again or edit manually.");
      }
      
    } catch (error) {
      console.error("Error scanning nutrition label:", error);
      setScanError("Failed to scan nutrition label. Please check your internet connection and try again.");
    } finally {
      setIsScanning(false);
    }
  };
  
  const handleEditResult = () => {
    if (scanResult) {
      setEditedResult({
        name: scanResult.name,
        calories: scanResult.calories.toString(),
        protein: scanResult.protein.toString(),
        carbs: scanResult.carbs.toString(),
        fat: scanResult.fat.toString(),
      });
      setShowEditModal(true);
    }
  };
  
  const handleSaveEdits = () => {
    const calories = parseFloat(editedResult.calories) || 0;
    const protein = parseFloat(editedResult.protein) || 0;
    const carbs = parseFloat(editedResult.carbs) || 0;
    const fat = parseFloat(editedResult.fat) || 0;
    
    setScanResult({
      name: editedResult.name,
      calories,
      protein,
      carbs,
      fat,
      calculationDetails: scanResult?.calculationDetails ? {
        ...scanResult.calculationDetails,
        adjustments: [
          ...scanResult.calculationDetails.adjustments,
          "Values manually edited by user"
        ]
      } : undefined,
    });
    setShowEditModal(false);
  };
  
  const handleSave = () => {
    if (!scanResult) return;
    
    const quantityMultiplier = parseFloat(quantity) || 1;
    
    onNutritionScanned({
      name: scanResult.name,
      calories: Math.round(scanResult.calories * quantityMultiplier),
      protein: Math.round(scanResult.protein * quantityMultiplier),
      carbs: Math.round(scanResult.carbs * quantityMultiplier),
      fat: Math.round(scanResult.fat * quantityMultiplier),
      quantity: quantity,
      servingSize: servingSize
    });
  };
  
  const handleRetake = () => {
    setPhoto(null);
    setScanResult(null);
    setScanError(null);
  };
  
  if (!photo) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.instructionContainer}>
                      <View style={styles.instructionHeader}>
            <ScanningFrameIcon size={64} color={colors.primary} style={styles.instructionIcon} />
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowInfoModal(true)}
            >
              <Info size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
            <Text style={styles.instructionTitle}>Scan Nutrition Label</Text>
            <Text style={styles.instructionText}>
              Take a clear photo of the nutrition facts label on your food package. 
              Make sure the text is readable and well-lit.
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Take Photo"
              onPress={handleTakePhoto}
              icon={<Camera size={20} color={colors.white} />}
              style={styles.primaryButton}
            />
            
            <Button
              title="Choose from Gallery"
              onPress={handleChooseFromGallery}
              variant="outline"
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo }} style={styles.photo} />
        </View>
        
        {!scanResult && !isScanning && !scanError && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionTitle}>Ready to Scan</Text>
            <Text style={styles.actionSubtitle}>
              Tap the button below to extract nutrition information from this label
            </Text>
            <Button
              title="Scan Nutrition Label"
              onPress={handleScanLabel}
              icon={<ScanningFrameIcon size={20} color={colors.white} />}
              style={styles.scanButton}
            />
          </View>
        )}
        
        {isScanning && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Scanning nutrition label...</Text>
            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
          </View>
        )}
        
        {scanError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Scan Failed</Text>
            <Text style={styles.errorText}>{scanError}</Text>
            <Button
              title="Try Again"
              onPress={handleScanLabel}
              style={styles.retryButton}
            />
          </View>
        )}
        
        {scanResult && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Nutrition Information</Text>
              <View style={styles.resultHeaderActions}>
                <TouchableOpacity 
                  onPress={() => setShowInfoModal(true)} 
                  style={styles.infoButtonSmall}
                >
                  <Info size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEditResult} style={styles.editButton}>
                  <Edit3 size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.nutritionCard}>
              <Text style={styles.foodName}>{scanResult.name}</Text>
              
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                  <Text style={styles.nutritionValue}>{scanResult.calories}</Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <Text style={styles.nutritionValue}>{scanResult.protein}g</Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                  <Text style={styles.nutritionValue}>{scanResult.carbs}g</Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                  <Text style={styles.nutritionValue}>{scanResult.fat}g</Text>
                </View>
              </View>
              
              {/* Serving size info */}
              {servingSize && (
                <Text style={styles.servingSizeText}>Per: {servingSize}</Text>
              )}
            </View>
            
            {/* Quantity Selection */}
            <View style={styles.quantityCard}>
              <Text style={styles.quantityTitle}>How much did you consume?</Text>
              
              <View style={styles.quantityInputContainer}>
                <View style={styles.quantityInput}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => {
                        const currentQty = parseInt(quantity) || 1;
                        if (currentQty > 1) {
                          setQuantity((currentQty - 1).toString());
                        }
                      }}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => {
                        const currentQty = parseInt(quantity) || 1;
                        setQuantity((currentQty + 1).toString());
                      }}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.quantityExamples}>
                  <Text style={styles.quantityExamplesTitle}>Quick Options:</Text>
                  <View style={styles.quantityExamplesButtons}>
                    <TouchableOpacity 
                      style={styles.quantityExampleButton}
                      onPress={() => setQuantity("0.5")}
                    >
                      <Text style={styles.quantityExampleText}>Half</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quantityExampleButton}
                      onPress={() => setQuantity("1")}
                    >
                      <Text style={styles.quantityExampleText}>1 Serving</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quantityExampleButton}
                      onPress={() => setQuantity("2")}
                    >
                      <Text style={styles.quantityExampleText}>2 Servings</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              {/* Calculated totals */}
              <View style={styles.calculatedTotals}>
                <Text style={styles.calculatedTitle}>Your Total Intake:</Text>
                <View style={styles.calculatedGrid}>
                  <View style={styles.calculatedItem}>
                    <Text style={styles.calculatedLabel}>Calories</Text>
                    <Text style={styles.calculatedValue}>
                      {Math.round((scanResult.calories * parseFloat(quantity)) || 0)}
                    </Text>
                  </View>
                  <View style={styles.calculatedItem}>
                    <Text style={styles.calculatedLabel}>Protein</Text>
                    <Text style={styles.calculatedValue}>
                      {Math.round((scanResult.protein * parseFloat(quantity)) || 0)}g
                    </Text>
                  </View>
                  <View style={styles.calculatedItem}>
                    <Text style={styles.calculatedLabel}>Carbs</Text>
                    <Text style={styles.calculatedValue}>
                      {Math.round((scanResult.carbs * parseFloat(quantity)) || 0)}g
                    </Text>
                  </View>
                  <View style={styles.calculatedItem}>
                    <Text style={styles.calculatedLabel}>Fat</Text>
                    <Text style={styles.calculatedValue}>
                      {Math.round((scanResult.fat * parseFloat(quantity)) || 0)}g
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {scanResult.calculationDetails && (
              <View style={styles.calculationDetailsCard}>
                <Text style={styles.calculationTitle}>📊 How These Numbers Were Calculated</Text>
                
                <View style={styles.calculationSection}>
                  <Text style={styles.calculationSectionTitle}>What I Found on Your Label:</Text>
                  <Text style={styles.calculationText}>{scanResult.calculationDetails.rawExtraction}</Text>
                </View>
                
                <View style={styles.calculationSection}>
                  <Text style={styles.calculationSectionTitle}>Processing Steps:</Text>
                  {scanResult.calculationDetails.processingSteps.map((step, index) => (
                    <Text key={index} style={styles.calculationStep}>
                      {index + 1}. {step}
                    </Text>
                  ))}
                </View>
                
                {scanResult.calculationDetails.adjustments && scanResult.calculationDetails.adjustments.length > 0 && (
                  <View style={styles.calculationSection}>
                    <Text style={styles.calculationSectionTitle}>Adjustments Made:</Text>
                    {scanResult.calculationDetails.adjustments.map((adjustment, index) => (
                      <Text key={index} style={styles.calculationAdjustment}>
                        • {adjustment}
                      </Text>
                    ))}
                  </View>
                )}
                
                <View style={styles.calculationSection}>
                  <Text style={styles.calculationSectionTitle}>Confidence Level:</Text>
                  <Text style={styles.calculationConfidence}>{scanResult.calculationDetails.confidence}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.resultActions}>
              <Button
                title="Save to Log"
                onPress={handleSave}
                icon={<Save size={20} color={colors.white} />}
                style={styles.saveButton}
              />
              
              <Button
                title="Retake Photo"
                onPress={handleRetake}
                variant="outline"
                style={styles.retakeButton}
              />
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Nutrition Information</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Food Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedResult.name}
                onChangeText={(text) => setEditedResult({ ...editedResult, name: text })}
                placeholder="Enter food name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                style={styles.textInput}
                value={editedResult.calories}
                onChangeText={(text) => setEditedResult({ ...editedResult, calories: text })}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.textInput}
                value={editedResult.protein}
                onChangeText={(text) => setEditedResult({ ...editedResult, protein: text })}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.textInput}
                value={editedResult.carbs}
                onChangeText={(text) => setEditedResult({ ...editedResult, carbs: text })}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput
                style={styles.textInput}
                value={editedResult.fat}
                onChangeText={(text) => setEditedResult({ ...editedResult, fat: text })}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button
              title="Save Changes"
              onPress={handleSaveEdits}
              style={styles.saveButton}
            />
            <Button
              title="Cancel"
              onPress={() => setShowEditModal(false)}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How OCR Scanning Works</Text>
            <TouchableOpacity onPress={() => setShowInfoModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>📸 Step 1: Image Analysis</Text>
              <Text style={styles.infoText}>
                The app uses AI-powered OCR (Optical Character Recognition) to read text from your nutrition label photo.
              </Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>🔍 Step 2: Data Extraction</Text>
              <Text style={styles.infoText}>
                The AI identifies key nutrition information like serving size, calories, protein, carbs, and fat from the standard nutrition facts format.
              </Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>🧮 Step 3: Smart Calculations</Text>
              <Text style={styles.infoText}>
                Here's how the app processes the extracted data:
              </Text>
              
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Example Calculation:</Text>
                <Text style={styles.exampleSubtitle}>From Nutrition Label:</Text>
                <Text style={styles.exampleText}>• Serving Size: 160g</Text>
                <Text style={styles.exampleText}>• Per Serving: 410 calories, 16.2g protein, 0.3g fat</Text>
                <Text style={styles.exampleText}>• Per 100g: 257 calories, 10.1g protein, 0.2g fat</Text>
                
                <Text style={styles.exampleSubtitle}>App Calculation Process:</Text>
                <Text style={styles.exampleText}>1. Uses "per serving" values as primary data</Text>
                <Text style={styles.exampleText}>2. Cross-references with "per 100g" for accuracy</Text>
                <Text style={styles.exampleText}>3. Estimates missing carbs from total calories</Text>
                <Text style={styles.exampleText}>4. Applies nutritional knowledge for balanced results</Text>
                
                <Text style={styles.exampleSubtitle}>Final Result:</Text>
                <Text style={styles.exampleResultText}>• 140 calories</Text>
                <Text style={styles.exampleResultText}>• 17.5g carbs (estimated from remaining calories)</Text>
                <Text style={styles.exampleResultText}>• 10.3g protein (adjusted for accuracy)</Text>
                <Text style={styles.exampleResultText}>• 0.3g fat (from label)</Text>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>✏️ Step 4: Manual Review</Text>
              <Text style={styles.infoText}>
                Always review and edit the extracted values if needed. The AI is very accurate but nutrition labels can vary in format and quality.
              </Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>💡 Tips for Best Results:</Text>
              <Text style={styles.infoText}>• Ensure good lighting when taking photos</Text>
              <Text style={styles.infoText}>• Keep the nutrition label flat and unfolded</Text>
              <Text style={styles.infoText}>• Make sure all text is clearly visible</Text>
              <Text style={styles.infoText}>• Avoid shadows or glare on the label</Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button
              title="Got It!"
              onPress={() => setShowInfoModal(false)}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionIcon: {
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 12,
  },
  photoContainer: {
    marginBottom: 20,
  },
  photo: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    resizeMode: "cover",
  },
  actionContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  scanButton: {
    minWidth: 200,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 150,
  },
  resultContainer: {
    paddingVertical: 20,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  editButton: {
    padding: 8,
  },
  nutritionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nutritionItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
  },
  nutritionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  resultActions: {
    gap: 12,
  },
  saveButton: {
    marginBottom: 8,
  },
  retakeButton: {
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  cancelButton: {
    marginBottom: 8,
  },
  instructionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 20,
  },
  infoButton: {
    position: "absolute",
    right: -30,
    top: 20,
    padding: 8,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  exampleContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  exampleSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 8,
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
    paddingLeft: 8,
  },
  exampleResultText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: "500",
    marginBottom: 2,
    paddingLeft: 8,
  },
  resultHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoButtonSmall: {
    padding: 6,
  },
  calculationDetailsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  calculationSection: {
    marginBottom: 12,
  },
  calculationSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 6,
  },
  calculationText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: "italic",
  },
  calculationStep: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  calculationAdjustment: {
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
    marginBottom: 2,
  },
  calculationConfidence: {
    fontSize: 13,
    color: colors.success,
    fontWeight: "500",
  },
  servingSizeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  quantityCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quantityTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  quantityInputContainer: {
    marginBottom: 16,
  },
  quantityInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
  },
  quantityExamples: {
    marginTop: 12,
  },
  quantityExamplesTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  quantityExamplesButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quantityExampleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: "center",
  },
  quantityExampleText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
  },
  calculatedTotals: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  calculatedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  calculatedGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calculatedItem: {
    alignItems: "center",
  },
  calculatedLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
}); 