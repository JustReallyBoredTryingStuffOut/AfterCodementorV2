import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform, Alert, Modal, Pressable } from "react-native";
import { Camera, ArrowLeft, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { colors } from "@/constants/colors";
import { FoodPhoto } from "@/store/photoStore";
import Button from "@/components/Button";

// Define CameraType as a string type
type CameraType = "front" | "back";

type FoodPhotoAnalyzerProps = {
  onPhotoTaken: (photo: FoodPhoto) => void;
  onCancel: () => void;
};

export default function FoodPhotoAnalyzer({ onPhotoTaken, onCancel }: FoodPhotoAnalyzerProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: string;
    portionSize: string;
    notes: string;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [photoQuality, setPhotoQuality] = useState<'good' | 'fair' | 'poor'>('good');
  
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
        setPhoto("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80");
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
        setPhoto("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80");
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
  
  const handleAnalyzePhoto = async () => {
    if (!photo) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Convert the image to base64
      const base64Image = await convertImageToBase64(photo);
      
      // Create a comprehensive prompt for accurate food identification
      const messages = [
        {
          role: "system",
          content: `You are a professional nutritionist and food identification expert with 20+ years of experience. Your task is to accurately identify foods from images and provide precise nutritional information.

ANALYSIS GUIDELINES:
1. **Food Identification**: Look for specific visual cues:
   - Color, texture, and shape
   - Cooking methods (grilled, fried, baked, raw)
   - Portion size and presentation
   - Ingredients visible (vegetables, meats, grains, sauces)
   - Cultural context and dish type

2. **Portion Estimation**: 
   - Estimate realistic serving sizes
   - Consider typical restaurant/home portions
   - Account for visible ingredients and preparation methods

3. **Nutritional Accuracy**:
   - Base estimates on standard recipes and USDA database
   - Consider cooking methods (fried vs grilled affects calories)
   - Account for visible sauces, dressings, and toppings
   - Provide realistic ranges for common foods

4. **Confidence Levels**:
   - High confidence: Clear, well-lit photos of recognizable dishes
   - Medium confidence: Partially visible or complex dishes
   - Low confidence: Blurry, dark, or unclear images

RESPONSE FORMAT:
Return ONLY a JSON object with these fields:
{
  "name": "Specific food name (e.g., 'Grilled Chicken Caesar Salad')",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "high|medium|low",
  "portion_size": "estimated serving description",
  "notes": "brief explanation of estimation method"
}

IMPORTANT: Only respond with the JSON object, no additional text.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this food image and provide accurate nutritional information. Consider the visual details, portion size, and preparation method." },
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
        
        setAnalysisResult({
          name: nutritionData.name,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fat: nutritionData.fat,
          confidence: nutritionData.confidence || "medium",
          portionSize: nutritionData.portion_size || "Standard serving",
          notes: nutritionData.notes || ""
        });
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError, data.completion);
        
        // Fallback to a default analysis if parsing fails
        setAnalysisResult({
          name: "Unknown Food",
          calories: 300,
          protein: 10,
          carbs: 30,
          fat: 15,
          confidence: "low",
          portionSize: "Estimated serving",
          notes: "Unable to accurately identify this food. Please verify the nutrition information."
        });
        
        setAnalysisError("We couldn't accurately analyze this food. Please verify the nutrition information.");
      }
    } catch (error) {
      console.error("Error analyzing photo:", error);
      
      // Fallback to a default analysis if the API call fails
      setAnalysisResult({
        name: "Unknown Food",
        calories: 300,
        protein: 10,
        carbs: 30,
        fat: 15,
        confidence: "low",
        portionSize: "Estimated serving",
        notes: "Unable to analyze this food. Please verify the nutrition information."
      });
      
      setAnalysisError("We couldn't analyze this food. Please verify the nutrition information.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleSave = () => {
    if (!photo || !analysisResult) return;
    
    const newFoodPhoto: FoodPhoto = {
      id: Date.now().toString(),
      uri: photo,
      date: new Date().toISOString(),
      name: analysisResult.name,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fat: analysisResult.fat,
      notes: "",
      isAnalyzed: true
    };
    
    onPhotoTaken(newFoodPhoto);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Analysis</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {!photo ? (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraPlaceholder}>
            <Camera size={48} color={colors.textLight} />
            <Text style={styles.cameraText}>Take a photo of your food</Text>
            
            {/* Photo quality tips */}
            <View style={styles.qualityTipsContainer}>
              <Text style={styles.qualityTipsTitle}>📸 Tips for Better Analysis:</Text>
              <Text style={styles.qualityTipsText}>• Good lighting (natural light works best)</Text>
              <Text style={styles.qualityTipsText}>• Clear, focused photo</Text>
              <Text style={styles.qualityTipsText}>• Include the entire dish</Text>
              <Text style={styles.qualityTipsText}>• Avoid shadows and glare</Text>
            </View>
            <View style={styles.photoButtonsContainer}>
              <Button 
                title="Take Photo" 
                onPress={handleTakePhoto} 
                style={styles.photoButton}
              />
              <Button 
                title="Choose from Gallery" 
                onPress={handleChooseFromGallery} 
                variant="outline"
                style={styles.photoButton}
              />
            </View>
            
            {/* Added CLOSE button */}
            <Button
              title="CLOSE"
              onPress={onCancel}
              variant="outline"
              style={styles.closeModalButton}
            />
          </View>
        </View>
      ) : (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo }} style={styles.photo} />
          
          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.analyzingText}>Analyzing your food...</Text>
            </View>
          ) : analysisResult ? (
            <View style={styles.resultContainer}>
              <Text style={styles.foodName}>{analysisResult.name}</Text>
              
              {/* Confidence indicator */}
              <View style={styles.confidenceContainer}>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: analysisResult.confidence === 'high' ? '#4CAF50' : 
                                   analysisResult.confidence === 'medium' ? '#FF9800' : '#F44336' }
                ]}>
                  <Text style={styles.confidenceText}>
                    {analysisResult.confidence.toUpperCase()} CONFIDENCE
                  </Text>
                </View>
              </View>
              
              {/* Portion size info */}
              <Text style={styles.portionSizeText}>{analysisResult.portionSize}</Text>
              
              {analysisError && (
                <Text style={styles.errorText}>{analysisError}</Text>
              )}
              
              <View style={styles.nutritionContainer}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{analysisResult.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{analysisResult.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{analysisResult.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{analysisResult.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>
              
              {/* Analysis notes */}
              {analysisResult.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesTitle}>Analysis Notes:</Text>
                  <Text style={styles.notesText}>{analysisResult.notes}</Text>
                </View>
              )}
              
              <View style={styles.buttonContainer}>
                <Button 
                  title="Save to Food Log" 
                  onPress={handleSave} 
                  style={styles.saveButton}
                />
                <Button 
                  title="Retake Photo" 
                  onPress={() => {
                    setPhoto(null);
                    setAnalysisResult(null);
                    setAnalysisError(null);
                  }} 
                  variant="outline"
                  style={styles.retakeButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <Button 
                title="Analyze Photo" 
                onPress={handleAnalyzePhoto} 
                style={styles.analyzeButton}
              />
              <Button 
                title="Retake Photo" 
                onPress={() => setPhoto(null)} 
                variant="outline"
                style={styles.retakeButton}
              />
              <Button
                title="Cancel"
                onPress={onCancel}
                variant="outline"
                style={styles.cancelButton}
              />
            </View>
          )}
        </View>
      )}

      {/* Tap outside to dismiss overlay */}
      <Modal
        visible={isAnalyzing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAnalyzing(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            // Only allow dismissing if not actively analyzing
            if (!isAnalyzing) {
              setIsAnalyzing(false);
            }
          }}
        >
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.analyzingText}>Analyzing your food...</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cameraPlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cameraText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 24,
  },
  photoButtonsContainer: {
    width: "100%",
    gap: 12,
  },
  photoButton: {
    width: "100%",
  },
  closeModalButton: {
    width: "100%",
    marginTop: 16,
  },
  photoContainer: {
    flex: 1,
    padding: 16,
  },
  photo: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  analyzingContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  analyzingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  resultContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  foodName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: colors.error || "#ff3b30",
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  nutritionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  nutritionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  analyzeButton: {
    width: "100%",
  },
  saveButton: {
    width: "100%",
  },
  retakeButton: {
    width: "100%",
  },
  cancelButton: {
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  confidenceContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  portionSizeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  notesContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  qualityTipsContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: "100%",
  },
  qualityTipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  qualityTipsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },
});