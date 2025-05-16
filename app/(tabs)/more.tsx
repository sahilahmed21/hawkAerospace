import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { height } = Dimensions.get('window');
const DRAWER_HEIGHT = height * 0.4; // 40% of screen height

const BottomDrawer = ({ navigation, visible, onClose }) => {
  const [animation] = useState(new Animated.Value(visible ? 0 : DRAWER_HEIGHT));
  
  useEffect(() => {
    Animated.timing(animation, {
      toValue: visible ? 0 : DRAWER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);
  
  const options = [
    { name: 'Settings', icon: 'settings', route: 'Settings' },
    {
      name: "BES",
      iconType: "image",
      imagePath: require('@/assets/images/logo.png'),
      route: "/screens/BES",
      iconStyle: { backgroundColor: 'black', borderRadius: 100, padding: 5 }
    },
    { name: 'Buy a Drone', icon: 'flight', route: 'BuyADrone' },
    { name: 'Coupons', icon: 'local-offer', route: 'Coupons' },
    { name: 'Help & Support', icon: 'support-agent', route: 'HelpSupport' },
    { name: 'Logout', icon: 'logout', route: 'Logout' },
  ];
  
  const handleOptionPress = (route) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(route);
    }, 300);
  };
  
  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      <Animated.View 
        style={[
          styles.drawer, 
          { transform: [{ translateY: animation }] }
        ]}
      >
        <View style={styles.drawerHandle}>
          <View style={styles.handleBar} />
        </View>
        
        <Text style={styles.drawerTitle}>More Options</Text>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionRow}
              onPress={() => handleOptionPress(option.route)}
            >
              <Icon name={option.icon} size={24} color="#4F4F4F" style={styles.optionIcon} />
              <Text style={styles.optionText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <SafeAreaView style={styles.bottomSafeArea} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  drawerHandle: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDDDDD',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bottomSafeArea: {
    height: Platform.OS === 'ios' ? 20 : 0,
  },
});

export default BottomDrawer;