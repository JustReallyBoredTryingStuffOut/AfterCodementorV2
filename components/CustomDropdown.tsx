import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  StyleSheet,
  Pressable
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  
  const handleSelect = (option: DropdownOption) => {
    onValueChange(option.value);
    setIsOpen(false);
  };
  
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { 
            borderColor: colors.border,
            backgroundColor: colors.card,
            opacity: disabled ? 0.6 : 1
          }
        ]}
        onPress={toggleDropdown}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text 
          style={[
            styles.dropdownText, 
            { 
              color: selectedOption ? colors.text : colors.textSecondary 
            }
          ]}
          numberOfLines={2}
        >
          {displayText}
        </Text>
        {isOpen ? (
          <ChevronUp size={20} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <Pressable 
            style={[
              styles.modalContent, 
              { backgroundColor: colors.card }
            ]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Option
              </Text>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    { 
                      backgroundColor: value === item.value ? colors.primaryLight : 'transparent',
                      borderBottomColor: colors.border
                    }
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text 
                    style={[
                      styles.optionText, 
                      { 
                        color: value === item.value ? colors.primary : colors.text,
                        fontWeight: value === item.value ? '600' : '400'
                      }
                    ]}
                    numberOfLines={3}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.optionsList}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionsList: {
    paddingBottom: 16,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    lineHeight: 22,
  },
});

export default CustomDropdown; 