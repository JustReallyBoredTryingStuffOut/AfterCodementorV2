import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Send, Plus, Trash2, Target, Activity, TrendingUp, Zap } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAiStore, AiChat, ChatMessage } from "@/store/aiStore";
import { useMacroStore } from "@/store/macroStore";
import { useHealthStore } from "@/store/healthStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { useGamificationStore } from "@/store/gamificationStore";

export default function AiChatScreen() {
  const router = useRouter();
  const { chats, addChat: addChatToStore, deleteChat, addMessageToChat } = useAiStore();
  const { userProfile, macroGoals } = useMacroStore();
  const { weightLogs, stepCount, calculateWeightProgress } = useHealthStore();
  const { workoutLogs, scheduledWorkouts, getRecommendedWorkouts } = useWorkoutStore();
  const { achievements, level, experience } = useGamificationStore();
  
  const [currentChat, setCurrentChat] = useState<AiChat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showChats, setShowChats] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  
  // Smart context function to gather user data
  const getUserContext = () => {
    const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : userProfile?.weight || 0;
    const targetWeight = userProfile?.targetWeight || 0;
    const recentWorkouts = workoutLogs.slice(-3); // Last 3 workouts
    const todayWorkouts = scheduledWorkouts.filter(sw => {
      const scheduleDate = new Date(sw.date);
      const today = new Date();
      return scheduleDate.toDateString() === today.toDateString();
    });
    
    return {
      userProfile,
      currentWeight,
      targetWeight,
      stepCount,
      macroGoals,
      recentWorkouts,
      todayWorkouts,
      achievements,
      level,
      experience
    };
  };
  
  // Generate smart system prompt with user context
  const generateSmartSystemPrompt = () => {
    const context = getUserContext();
    const { userProfile, currentWeight, targetWeight, stepCount, macroGoals, recentWorkouts, todayWorkouts } = context;
    
    return `You are a personalized fitness AI assistant for ${userProfile?.name || 'User'}.

USER CONTEXT:
- Current Weight: ${currentWeight} kg
- Target Weight: ${targetWeight} kg (${targetWeight > 0 ? `${Math.abs(currentWeight - targetWeight).toFixed(1)} kg ${currentWeight > targetWeight ? 'to lose' : 'to gain'}` : 'No target set'})
- Fitness Goal: ${userProfile?.fitnessGoal || 'maintain'}
- Activity Level: ${userProfile?.activityLevel || 'moderate'}
- Fitness Level: ${userProfile?.fitnessLevel || 'beginner'}
- Daily Steps: ${stepCount || 0}
- Nutrition Goals: ${macroGoals ? `${macroGoals.calories} calories, ${macroGoals.protein}g protein, ${macroGoals.carbs}g carbs, ${macroGoals.fat}g fat` : 'Not set'}
- Recent Workouts: ${recentWorkouts.length} in last 3 sessions
- Today's Scheduled: ${todayWorkouts.length} workouts
- Level: ${level} (${experience} XP)

RESPONSE GUIDELINES:
- Reference their specific data when giving advice
- Suggest workouts based on their fitness level and goals
- Provide nutrition advice aligned with their macro goals
- Track progress and celebrate achievements
- Be encouraging and motivational
- Give actionable, specific advice
- Reference their recent activity when relevant
- Respond in a conversational, human-like manner without markdown formatting`;
  };
  
  // Create a new chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    } else {
      // Set the most recent chat as current
      setCurrentChat(chats[chats.length - 1]);
    }
  }, [chats]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (currentChat?.messages.length && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentChat?.messages]);
  
  // Proactive features - suggest helpful actions
  useEffect(() => {
    if (currentChat && currentChat.messages.length <= 2) {
      // This is a new chat, show proactive suggestions
      const context = getUserContext();
      const suggestions = [];
      
      if (context.targetWeight > 0) {
        suggestions.push("Check my weight loss progress");
      }
      
      if (context.stepCount < 5000) {
        suggestions.push("I need motivation to move more");
      }
      
      if (context.recentWorkouts.length === 0) {
        suggestions.push("Suggest a workout for me");
      }
      
      if (suggestions.length > 0) {
        // Add proactive message after a delay
        setTimeout(() => {
          addMessageToChat(currentChat.id, {
            role: "assistant",
            content: `${generateProactiveMessage()}\n\nI can help you with:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nJust tap the quick actions or ask me anything!`
          });
        }, 2000);
      }
    }
  }, [currentChat]);
  
  const createNewChat = () => {
    const smartSystemPrompt = generateSmartSystemPrompt();
    
    const newChat: AiChat = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      messages: [
        {
          id: "system-1",
          role: "system",
          content: smartSystemPrompt,
          timestamp: new Date().toISOString()
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: `Hi ${userProfile?.name || 'there'}! I'm your personalized fitness assistant. I can see your current progress and goals. How can I help you today?`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    addChatToStore(newChat);
    setCurrentChat(newChat);
    setShowChats(false);
  };
  
  const handleSendMessage = async () => {
    if (!message.trim() || !currentChat) return;
    
    const userMessage = {
      role: "user" as const,
      content: message.trim()
    };
    
    // Add user message to chat
    addMessageToChat(currentChat.id, userMessage);
    setMessage("");
    setIsLoading(true);
    
    try {
      // Prepare messages for API
      const apiMessages = currentChat.messages
        .filter(msg => msg.role !== "system") // Filter out system messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add the new user message
      apiMessages.push(userMessage);
      
      // Add smart system message with user context
      const smartSystemMessage = {
        role: "system" as const,
        content: generateSmartSystemPrompt()
      };
      
      // Make API request
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          messages: [smartSystemMessage, ...apiMessages]
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }
      
      const data = await response.json();
      
      // Process the response to remove any remaining markdown formatting
      let cleanedResponse = data.completion;
      // Remove markdown bold/italic formatting (** or __ for bold, * or _ for italic)
      cleanedResponse = cleanedResponse.replace(/(\*\*|__)(.*?)\1/g, '$2');
      cleanedResponse = cleanedResponse.replace(/(\*|_)(.*?)\1/g, '$2');
      
      // Add AI response to chat
      addMessageToChat(currentChat.id, {
        role: "assistant",
        content: cleanedResponse
      });
      
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to get response. Please try again.");
      
      // Add error message to chat
      addMessageToChat(currentChat.id, {
        role: "assistant",
        content: "Sorry, I'm having trouble responding right now. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this conversation?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => {
            deleteChat(chatId);
            if (currentChat?.id === chatId) {
              if (chats.length > 1) {
                // Find another chat to display
                const remainingChats = chats.filter(c => c.id !== chatId);
                setCurrentChat(remainingChats[remainingChats.length - 1]);
              } else {
                // Create a new chat if this was the last one
                createNewChat();
              }
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleSelectChat = (chat: AiChat) => {
    setCurrentChat(chat);
    setShowChats(false);
  };
  
  // Quick action functions
  const handleQuickAction = (action: string) => {
    const context = getUserContext();
    let quickMessage = "";
    
    switch (action) {
      case "progress":
        const weightDiff = context.currentWeight - context.targetWeight;
        quickMessage = `How am I doing with my ${context.userProfile?.fitnessGoal || 'fitness'} goals? I'm currently at ${context.currentWeight}kg and my target is ${context.targetWeight}kg.`;
        break;
      case "workout":
        quickMessage = `Can you suggest a ${context.userProfile?.fitnessLevel || 'beginner'} level workout for my ${context.userProfile?.fitnessGoal || 'fitness'} goals?`;
        break;
      case "nutrition":
        quickMessage = `I need help with my nutrition. My goals are ${context.macroGoals?.calories} calories, ${context.macroGoals?.protein}g protein. Can you suggest some meal ideas?`;
        break;
      case "motivation":
        quickMessage = "I need some motivation today. Can you give me a pep talk?";
        break;
      case "analysis":
        quickMessage = "Can you analyze my recent progress and give me some insights?";
        break;
      case "tips":
        quickMessage = `I'm a ${context.userProfile?.fitnessLevel || 'beginner'} trying to ${context.userProfile?.fitnessGoal || 'get fit'}. What are your top tips for me?`;
        break;
      default:
        quickMessage = action;
    }
    
    setMessage(quickMessage);
    setShowQuickActions(false);
  };
  
  // Proactive check-in function
  const generateProactiveMessage = () => {
    const context = getUserContext();
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12) {
      return `Good morning ${context.userProfile?.name || 'there'}! Ready to crush your fitness goals today?`;
    } else if (hour < 17) {
      return `Good afternoon! How's your fitness journey going today?`;
    } else {
      return `Good evening! How did your fitness activities go today?`;
    }
  };
  
  const renderChatItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.assistantMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };
  
  // Render context card component
  const renderContextCard = () => {
    const context = getUserContext();
    const { userProfile, currentWeight, targetWeight, stepCount, level } = context;
    
    return (
      <View style={styles.contextCard}>
        <View style={styles.contextHeader}>
          <Text style={styles.contextTitle}>Your Progress</Text>
          <Text style={styles.contextSubtitle}>Level {level}</Text>
        </View>
        
        <View style={styles.contextStats}>
          <View style={styles.contextStat}>
            <Text style={styles.contextStatLabel}>Weight</Text>
            <Text style={styles.contextStatValue}>{currentWeight.toFixed(1)} kg</Text>
            {targetWeight > 0 && (
              <Text style={styles.contextStatTarget}>Target: {targetWeight.toFixed(1)} kg</Text>
            )}
          </View>
          
          <View style={styles.contextStat}>
            <Text style={styles.contextStatLabel}>Steps</Text>
            <Text style={styles.contextStatValue}>{stepCount || 0}</Text>
          </View>
          
          <View style={styles.contextStat}>
            <Text style={styles.contextStatLabel}>Goal</Text>
            <Text style={styles.contextStatValue}>{userProfile?.fitnessGoal || 'maintain'}</Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render quick actions component
  const renderQuickActions = () => {
    const quickActions = [
      { id: "progress", title: "Check Progress", icon: "📊" },
      { id: "workout", title: "Get Workout", icon: "💪" },
      { id: "nutrition", title: "Meal Ideas", icon: "🥗" },
      { id: "motivation", title: "Motivate Me", icon: "🔥" },
      { id: "analysis", title: "Analyze Data", icon: "📈" },
      { id: "tips", title: "Get Tips", icon: "💡" },
    ];
    
    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action.id)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  const renderChatListItem = ({ item }: { item: AiChat }) => {
    // Get first user message or first assistant message if no user message
    const firstUserMessage = item.messages.find(msg => msg.role === "user");
    const firstMessage = firstUserMessage || item.messages.find(msg => msg.role === "assistant");
    const preview = firstMessage ? firstMessage.content.substring(0, 30) + (firstMessage.content.length > 30 ? "..." : "") : "New conversation";
    
    // Format date
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const isSelected = currentChat?.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.chatListItem,
          isSelected && styles.selectedChatListItem
        ]}
        onPress={() => handleSelectChat(item)}
      >
        <View style={styles.chatListItemContent}>
          <Text style={styles.chatListItemPreview} numberOfLines={1}>
            {preview}
          </Text>
          <Text style={styles.chatListItemDate}>{formattedDate}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteChatButton}
          onPress={() => handleDeleteChat(item.id)}
        >
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "AI Assistant",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={() => setShowQuickActions(!showQuickActions)}
                style={styles.quickActionsToggle}
              >
                <Zap size={20} color={showQuickActions ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowChats(!showChats)}
                style={styles.chatListButton}
              >
                <Text style={styles.chatListButtonText}>
                  {showChats ? "Hide Chats" : "Show Chats"}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <View style={styles.content}>
        {showChats ? (
          <View style={styles.chatListContainer}>
            <View style={styles.chatListHeader}>
              <Text style={styles.chatListTitle}>Your Conversations</Text>
              <TouchableOpacity 
                style={styles.newChatButton}
                onPress={createNewChat}
              >
                <Plus size={20} color={colors.primary} />
                <Text style={styles.newChatButtonText}>New Chat</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={chats.slice().reverse()} // Reverse to show newest first
              renderItem={renderChatListItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatList}
            />
          </View>
        ) : (
          currentChat && (
            <>
              {/* Context Card */}
              {renderContextCard()}
              
              {/* Quick Actions */}
              {showQuickActions && renderQuickActions()}
              
              <FlatList
                ref={flatListRef}
                data={currentChat.messages.filter(msg => msg.role !== "system")}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            </>
          )
        )}
      </View>
      
      {!showChats && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Ask me anything about fitness..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxHeight={100}
              maxLength={500}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!message.trim() || isLoading) && styles.disabledSendButton
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  chatListButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },
  chatListButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: "row",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: "80%",
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
  },
  assistantMessageBubble: {
    backgroundColor: colors.card,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  assistantMessageText: {
    color: colors.text,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: colors.primaryLight,
    opacity: 0.7,
  },
  chatListContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatListTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  newChatButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
  chatList: {
    padding: 16,
  },
  chatListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedChatListItem: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  chatListItemContent: {
    flex: 1,
  },
  chatListItemPreview: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  chatListItemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteChatButton: {
    padding: 8,
  },
  // New styles for context card and quick actions
  contextCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contextHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  contextSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contextStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  contextStat: {
    alignItems: "center",
  },
  contextStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contextStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  contextStatTarget: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  quickActionsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 8,
  },
  quickActionButton: {
    width: "30%",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 10,
    textAlign: "center",
    color: colors.text,
    fontWeight: "500",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickActionsToggle: {
    padding: 8,
    marginRight: 8,
  },
});