import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import tw from "../tailwind";
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './contexts/UserContext';

interface FormData {
  address: string;
  acres: string;
  numberOfTanks: string;
  tanksToSpray: string;
  sprayingDate: string;
  agrochemical: string;
  crop: string;
  coupon: string;
}

interface SprayRequest {
  id: string;
  userId: string;
  address: string;
  acres: number;
  numberOfTanks: number;
  tanksToSpray: number;
  sprayingDate: any;
  agrochemical: string;
  crop: string;
  price: number;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Rejected';
  createdAt: any;
  updatedAt: any;
  couponApplied: string | null;
}

type FormField = keyof FormData;

const Spraying = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const params = useLocalSearchParams<{ lat?: string; lng?: string; selectedCrop?: string }>();

  const [formData, setFormData] = useState<FormData>({
    address: 'Nashik',
    acres: '',
    numberOfTanks: '',
    tanksToSpray: '3',
    sprayingDate: '2025-03-13',
    agrochemical: 'Insecticide',
    crop: 'Bajra',
    coupon: ''
  });

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [finalPrice, setFinalPrice] = useState(1500.00);
  const [couponError, setCouponError] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCrops, setFilteredCrops] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isMounted) return;
      setLocationPermission(status);
      setIsLoading(false);
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (params.lat && params.lng) {
      setSelectedLocation({
        latitude: parseFloat(params.lat),
        longitude: parseFloat(params.lng),
      });
    }

    if (params.selectedCrop) {
      handleInputChange('crop', params.selectedCrop);
    }
  }, [params]);

  const handleInputChange = (field: FormField, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateRequest = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a request.');
      return;
    }
    if (!formData.acres || !formData.numberOfTanks || !formData.tanksToSpray || !formData.sprayingDate || !formData.crop) {
      Alert.alert('Error', 'Please fill all required fields related to spraying need, date, and crop.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRequestData: SprayRequest = {
        id: Math.random().toString(36).substring(7),
        userId: currentUser.uid,
        address: formData.address,
        acres: parseFloat(formData.acres) || 0,
        numberOfTanks: parseInt(formData.numberOfTanks) || 0,
        tanksToSpray: parseInt(formData.tanksToSpray) || 0,
        sprayingDate: firestore.Timestamp.fromDate(new Date(formData.sprayingDate)),
        agrochemical: formData.agrochemical,
        crop: formData.crop,
        price: finalPrice,
        status: 'Pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        couponApplied: formData.coupon.trim() || null,
      };

      await firestore().collection('sprayRequests').add(newRequestData);

      Alert.alert('Success', 'Request created successfully!');
      router.push({ pathname: '/(tabs)/requests', params: { refresh: 'true' } });
    } catch (error: any) {
      console.error('Error creating request:', error);
      Alert.alert('Error', error.message || 'Failed to create request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCouponApply = () => {
    const coupon = formData.coupon.trim();
    if (coupon === 'DISCOUNT10') {
      const discountedPrice = finalPrice - (finalPrice * 0.10);
      setFinalPrice(discountedPrice);
      setCouponError('');
      Alert.alert('Success', '10% discount applied!');
    } else if (coupon === 'DISCOUNT20') {
      const discountedPrice = finalPrice - (finalPrice * 0.20);
      setFinalPrice(discountedPrice);
      setCouponError('');
      Alert.alert('Success', '20% discount applied!');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const StepIcon = ({ icon }) => (
    <View style={tw`w-6 h-6 rounded-full bg-green-500 items-center justify-center mr-3`}>
      {icon}
    </View>
  );

  const allCrops = [
    'Arecanut', 'Bajra', 'Banana', 'Barley', 'Black Pepper',
    'Brinjal', 'Cabbage', 'Cardamom', 'Cashew Nut', 'Castor seed',
    'Cauliflower', 'Chilli', 'Coconut', 'Coffee', 'Cotton',
    'Cucumber', 'Garlic', 'Ginger', 'Gram', 'Grapes',
    'Groundnut', 'Jowar', 'Jute', 'Lentil', 'Maize',
    'Mango', 'Mustard', 'Onion', 'Orange', 'Paddy',
    'Pea', 'Potato', 'Ragi', 'Rapeseed', 'Rice',
    'Rubber', 'Safflower', 'Soyabean', 'Sugarcane', 'Sunflower',
    'Tea', 'Tomato', 'Turmeric', 'Wheat'
  ];

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCrops(allCrops);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allCrops.filter(crop =>
        crop.toLowerCase().includes(query)
      );
      setFilteredCrops(filtered);
    }
  }, [searchQuery]);

  useEffect(() => {
    setFilteredCrops(allCrops);
  }, []);

  const handleViewAllCrops = () => {
    setShowCropModal(true);
  };

  const handleSelectCrop = (crop: string) => {
    handleInputChange('crop', crop);
    setShowCropModal(false);
  };

  const renderCropItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={tw`py-3 border-b border-gray-100 flex-row items-center`}
      onPress={() => handleSelectCrop(item)}
    >
      <Text style={tw`text-base`}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100`}>
      <Modal
        visible={showCropModal}
        animationType="slide"
        transparent={true}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50`}>
          <View style={tw`bg-white rounded-t-3xl h-5/6 mt-auto`}>
            <View style={tw`p-4 flex-row justify-between items-center border-b border-gray-200`}>
              <Text style={tw`text-lg font-medium`}>All Crops</Text>
              <TouchableOpacity onPress={() => setShowCropModal(false)}>
                <Text style={tw`text-gray-500`}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={tw`p-4`}>
              <View style={tw`bg-gray-100 rounded-full flex-row items-center px-4 py-2`}>
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  style={tw`flex-1 ml-2 text-base`}
                  placeholder="Search your crops..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <FlatList
              data={filteredCrops}
              renderItem={renderCropItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={tw`px-4`}
            />
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={tw`pb-10`}>
        <View style={tw`bg-white`}>
          <View style={tw`p-4 border-b border-gray-100`}>
            <View style={tw`flex-row items-center mb-3`}>
              <StepIcon icon={<Ionicons name="location-outline" size={14} color="white" />} />
              <Text style={tw`text-sm`}>Tell us your address</Text>
            </View>
            <TextInput
              placeholder="Enter address"
              style={tw`border border-gray-300 rounded-full py-3 px-4`}
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
            />
          </View>

          <View style={tw`p-4 border-b border-gray-100`}>
            <View style={tw`flex-row items-center mb-3`}>
              <StepIcon icon={<MaterialCommunityIcons name="spray" size={14} color="white" />} />
              <Text style={tw`text-sm`}>Tell us about your spraying need</Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <TextInput
                placeholder="Acres"
                style={tw`border border-gray-300 rounded-full py-3 px-4 w-5/12`}
                value={formData.acres}
                onChangeText={(text) => handleInputChange('acres', text)}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="No. of Tank"
                style={tw`border border-gray-300 rounded-full py-3 px-4 w-5/12`}
                value={formData.numberOfTanks}
                onChangeText={(text) => handleInputChange('numberOfTanks', text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={tw`p-4 border-b border-gray-100`}>
            <View style={tw`flex-row items-center mb-3`}>
              <StepIcon icon={<MaterialCommunityIcons name="water-pump" size={14} color="white" />} />
              <Text style={tw`text-sm`}>How many no. of tanks you want to spray?</Text>
            </View>
            <TextInput
              placeholder="Enter number of tanks"
              style={tw`border border-gray-300 rounded-full py-3 px-4`}
              value={formData.tanksToSpray}
              onChangeText={(text) => handleInputChange('tanksToSpray', text)}
              keyboardType="numeric"
            />
          </View>

          <View style={tw`p-4 border-b border-gray-100`}>
            <View style={tw`flex-row items-center mb-3`}>
              <StepIcon icon={<Ionicons name="calendar-outline" size={14} color="white" />} />
              <Text style={tw`text-sm`}>When you want spraying?</Text>
            </View>
            <TextInput
              placeholder="YYYY-MM-DD"
              style={tw`border border-gray-300 rounded-full py-3 px-4`}
              value={formData.sprayingDate}
              onChangeText={(text) => handleInputChange('sprayingDate', text)}
            />
          </View>

          <View style={tw`p-4 border-b border-gray-100`}>
            <View style={tw`flex-row items-center mb-3`}>
              <StepIcon icon={<FontAwesome5 name="flask" size={12} color="white" />} />
              <Text style={tw`text-sm`}>Select Agrochemical</Text>
            </View>
            <TextInput
              placeholder="Select agrochemical"
              style={tw`border border-gray-300 rounded-full py-3 px-4`}
              value={formData.agrochemical}
              editable={false}
            />
          </View>

          <View style={tw`p-4 border-b border-gray-100`}>
            <View style={tw`flex-row items-center mb-3`}>
              <StepIcon icon={<MaterialCommunityIcons name="seed-outline" size={14} color="white" />} />
              <Text style={tw`text-sm`}>Select Crop</Text>
            </View>

            <View style={tw`mt-2`}>
              <View style={tw`flex-row flex-wrap`}>
                <TouchableOpacity
                  style={tw`mr-2 mb-2 border border-gray-300 rounded-full py-2 px-4 flex-row items-center ${formData.crop === 'Arecanut' ? 'bg-green-50 border-green-500' : ''}`}
                  onPress={() => handleInputChange('crop', 'Arecanut')}
                >
                  {formData.crop === 'Arecanut' && (
                    <MaterialCommunityIcons name="check" size={16} color="green" style={tw`mr-1`} />
                  )}
                  <Text>Arecanut</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`mr-2 mb-2 border border-gray-300 rounded-full py-2 px-4 flex-row items-center ${formData.crop === 'Bajra' ? 'bg-green-50 border-green-500' : ''}`}
                  onPress={() => handleInputChange('crop', 'Bajra')}
                >
                  {formData.crop === 'Bajra' && (
                    <MaterialCommunityIcons name="check" size={16} color="green" style={tw`mr-1`} />
                  )}
                  <Text>Bajra</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`mb-2 border border-gray-300 rounded-full py-2 px-4 flex-row items-center`}
                  onPress={handleViewAllCrops}
                >
                  <Text style={tw`text-blue-600`}>View all</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={tw`p-4 border-b border-gray-100`}>
            <View style={tw`flex-row items-center mb-3`}>
              <StepIcon icon={<AntDesign name="gift" size={14} color="white" />} />
              <Text style={tw`text-sm`}>Apply Coupon</Text>
            </View>
            <TextInput
              placeholder="Enter coupon code"
              style={tw`border border-gray-300 rounded-full py-3 px-4`}
              value={formData.coupon}
              onChangeText={(text) => handleInputChange('coupon', text)}
            />
            {couponError ? <Text style={tw`text-red-500 text-sm mt-2`}>{couponError}</Text> : null}
            <TouchableOpacity onPress={handleCouponApply} style={tw`mt-2 bg-blue-600 rounded-full py-2 items-center`}>
              <Text style={tw`text-white font-semibold`}>Apply Coupon</Text>
            </TouchableOpacity>
          </View>

          <View style={tw`p-4 border-b border-gray-100`}>
            <Text style={tw`text-lg font-semibold`}>Final Price: ₹{finalPrice.toFixed(2)}</Text>
          </View>

          <View style={tw`p-4`}>
            <TouchableOpacity
              onPress={handleCreateRequest}
              style={tw`bg-blue-600 rounded-full py-4 items-center ${isSubmitting ? 'opacity-50' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-semibold`}>Create Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Spraying;