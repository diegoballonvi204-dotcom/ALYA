declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const StyleSheet: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const Alert: any;
  export const Linking: any;
  export const FlatList: any;
  export const ActivityIndicator: any;
  export const Image: any;
  export const Dimensions: any;
  export const Animated: any;
  export const Platform: any;
  export const SafeAreaView: any;
  export const Pressable: any;
  export const TextInput: any;
  export const Modal: any;
  export const StatusBar: any;
  export default any;
}

declare module '@expo/vector-icons' {
  export const Ionicons: any;
  export const MaterialCommunityIcons: any;
  export const FontAwesome: any;
  export const Feather: any;
  export const AntDesign: any;
}

declare module 'lucide-react-native' {
  export const Sparkles: any;
  export const Award: any;
  export const Heart: any;
  export const X: any;
  export const ShieldCheck: any;
  export const Star: any;
  export const MapPin: any;
  export const Briefcase: any;
  export const Clock: any;
  export const MessageSquare: any;
  export const Calendar: any;
  export const User: any;
  export const Search: any;
  export const ChevronRight: any;
  export const ChevronLeft: any;
  export const Info: any;
  export const Check: any;
  export const AlertCircle: any;
  export const Filter: any;
  export const Bell: any;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string, options?: any): Promise<string | null>;
  export function setItemAsync(key: string, value: string, options?: any): Promise<void>;
  export function deleteItemAsync(key: string, options?: any): Promise<void>;
}

declare module 'expo-router' {
  export const useRouter: any;
  export const useLocalSearchParams: any;
  export const Stack: any;
  export const Tabs: any;
  export const Link: any;
}
