export const colors = {
  primary: "#4A90E2",
  secondary: "#50C878",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#212529",
  textSecondary: "#6C757D",
  textLight: "#ADB5BD",
  border: "#DEE2E6",
  error: "#DC3545",
  success: "#28A745",
  warning: "#FFC107",
  info: "#17A2B8",
  shadow: "#000000",
  inactive: "#E9ECEF",
  
  // Macro colors
  calorieColor: "#FF6B6B", // Red for calories
  macroProtein: "#4A90E2", // Blue
  macroCarbs: "#50C878",   // Green
  macroFat: "#FFA500",     // Orange
  
  // Workout intensity colors
  intensityLow: "#50C878",    // Green
  intensityMedium: "#FFC107", // Yellow
  intensityHigh: "#DC3545",   // Red
  
  // Dark mode colors (if needed)
  darkBackground: "#212529",
  darkCard: "#343A40",
  darkText: "#F8F9FA",
  darkTextSecondary: "#ADB5BD",
  darkBorder: "#495057",
  
  // Gradients
  gradientStart: "#4A90E2",
  gradientEnd: "#50C878",
  
  // UI colors
  highlight: "#F0F7FF",
  white: "#FFFFFF",
  black: "#000000",
  
  // Background variants
  backgroundLight: "#E9ECEF",
};

// Base theme colors
export const lightTheme = {
  ...colors,
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
};

export const darkTheme = {
  ...colors,
  background: "#212529",
  card: "#343A40",
  text: "#F8F9FA",
  textSecondary: "#ADB5BD",
  border: "#495057",
  primary: "#5C9CE6",
  secondary: "#60D888",
};

// Color scheme definitions
const colorSchemes = {
  blue: {
    light: {
      primary: "#4A90E2",
      secondary: "#5FB0E5",
      gradientStart: "#4A90E2",
      gradientEnd: "#5FB0E5",
    },
    dark: {
      primary: "#5C9CE6",
      secondary: "#6FBAE9",
      gradientStart: "#5C9CE6",
      gradientEnd: "#6FBAE9",
    }
  },
  green: {
    light: {
      primary: "#50C878",
      secondary: "#4CD964",
      gradientStart: "#50C878",
      gradientEnd: "#4CD964",
    },
    dark: {
      primary: "#60D888",
      secondary: "#5CE974",
      gradientStart: "#60D888",
      gradientEnd: "#5CE974",
    }
  },
  purple: {
    light: {
      primary: "#8A2BE2",
      secondary: "#9B59B6",
      gradientStart: "#8A2BE2",
      gradientEnd: "#9B59B6",
    },
    dark: {
      primary: "#9A3BF2",
      secondary: "#AB69C6",
      gradientStart: "#9A3BF2",
      gradientEnd: "#AB69C6",
    }
  },
  orange: {
    light: {
      primary: "#FF9500",
      secondary: "#FF7F50",
      gradientStart: "#FF9500",
      gradientEnd: "#FF7F50",
    },
    dark: {
      primary: "#FFA520",
      secondary: "#FF8F60",
      gradientStart: "#FFA520",
      gradientEnd: "#FF8F60",
    }
  },
  pink: {
    light: {
      primary: "#FF6B6B",
      secondary: "#FF8787",
      gradientStart: "#FF6B6B",
      gradientEnd: "#FF8787",
    },
    dark: {
      primary: "#FF7B7B",
      secondary: "#FF9797",
      gradientStart: "#FF7B7B",
      gradientEnd: "#FF9797",
    }
  },
  // New modern themes
  pastel: {
    light: {
      primary: "#B5D8EB",
      secondary: "#F8C8DC",
      gradientStart: "#B5D8EB",
      gradientEnd: "#F8C8DC",
      background: "#F9F7F7",
      card: "#FFFFFF",
      text: "#5D5C61",
      textSecondary: "#7D7C84",
      border: "#E6E6EA",
    },
    dark: {
      primary: "#A5C8DB",
      secondary: "#E8B8CC",
      gradientStart: "#A5C8DB",
      gradientEnd: "#E8B8CC",
      background: "#2D2D34",
      card: "#3E3E46",
      text: "#E6E6EA",
      textSecondary: "#C5C5D0",
      border: "#4D4D56",
    }
  },
  monochrome: {
    light: {
      primary: "#555555",
      secondary: "#888888",
      gradientStart: "#555555",
      gradientEnd: "#888888",
      background: "#F5F5F5",
      card: "#FFFFFF",
      text: "#333333",
      textSecondary: "#666666",
      border: "#DDDDDD",
    },
    dark: {
      primary: "#AAAAAA",
      secondary: "#CCCCCC",
      gradientStart: "#AAAAAA",
      gradientEnd: "#CCCCCC",
      background: "#222222",
      card: "#333333",
      text: "#EEEEEE",
      textSecondary: "#BBBBBB",
      border: "#444444",
    }
  },
  nature: {
    light: {
      primary: "#7D9D9C",
      secondary: "#E4D1B9",
      gradientStart: "#7D9D9C",
      gradientEnd: "#E4D1B9",
      background: "#F8F4EA",
      card: "#FFFFFF",
      text: "#576F72",
      textSecondary: "#7D9D9C",
      border: "#E4D1B9",
    },
    dark: {
      primary: "#8DAD9C",
      secondary: "#F4E1C9",
      gradientStart: "#8DAD9C",
      gradientEnd: "#F4E1C9",
      background: "#2C3639",
      card: "#3F4E4F",
      text: "#F8F4EA",
      textSecondary: "#E4D1B9",
      border: "#576F72",
    }
  },
  vibrant: {
    light: {
      primary: "#FF3366",
      secondary: "#33CCFF",
      gradientStart: "#FF3366",
      gradientEnd: "#33CCFF",
      background: "#FFFFFF",
      card: "#F9F9F9",
      text: "#222222",
      textSecondary: "#555555",
      border: "#EEEEEE",
    },
    dark: {
      primary: "#FF5588",
      secondary: "#55DDFF",
      gradientStart: "#FF5588",
      gradientEnd: "#55DDFF",
      background: "#111111",
      card: "#222222",
      text: "#FFFFFF",
      textSecondary: "#CCCCCC",
      border: "#333333",
    }
  },
  minimal: {
    light: {
      primary: "#007AFF",
      secondary: "#5AC8FA",
      gradientStart: "#007AFF",
      gradientEnd: "#5AC8FA",
      background: "#FFFFFF",
      card: "#F9F9F9",
      text: "#000000",
      textSecondary: "#8E8E93",
      border: "#E5E5EA",
    },
    dark: {
      primary: "#0A84FF",
      secondary: "#64D2FF",
      gradientStart: "#0A84FF",
      gradientEnd: "#64D2FF",
      background: "#000000",
      card: "#1C1C1E",
      text: "#FFFFFF",
      textSecondary: "#8E8E93",
      border: "#38383A",
    }
  }
};

// Function to get colors based on theme and color scheme
export const getColors = (theme: "light" | "dark", colorScheme = "blue") => {
  // Get the base theme
  const baseTheme = theme === "dark" ? { ...darkTheme } : { ...lightTheme };
  
  // Apply color scheme if it exists
  if (colorSchemes[colorScheme]) {
    const schemeColors = colorSchemes[colorScheme][theme];
    return {
      ...baseTheme,
      ...schemeColors,
      // Update macro colors based on color scheme
      macroProtein: schemeColors.primary, // Use primary color for protein
    };
  }
  
  return baseTheme;
};