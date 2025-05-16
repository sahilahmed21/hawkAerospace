import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/UserContext';
import { Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import tw from '../../tailwind';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash.debounce';

const { width, height } = Dimensions.get('window');

type SprayRequestStatus =
  | 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Rejected'
  | 'Canceled' | 'Out of Service' | 'Rescheduled' | 'Placed' | 'Paid' | 'On Hold';

interface SprayRequest {
  id: string;
  userId: string;
  address: string;
  acres: number;
  numberOfTanks: number;
  tanksToSpray: number;
  sprayingDate: FirebaseFirestoreTypes.Timestamp;
  agrochemical: string;
  crop: string;
  price: number;
  status: SprayRequestStatus;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

const Requests = (): JSX.Element => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ refresh?: string }>();
  const [requests, setRequests] = useState<SprayRequest[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<SprayRequest | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<SprayRequestStatus | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeDateInput, setActiveDateInput] = useState<'start' | 'end' | null>(null);

  const statusOptions: SprayRequestStatus[] = [
    'Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected',
    'Canceled', 'Out of Service', 'Rescheduled', 'Placed', 'Paid', 'On Hold',
  ];

  const fetchRequests = useCallback(() => {
    if (!currentUser) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = firestore()
      .collection('sprayRequests')
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const fetchedRequests: SprayRequest[] = [];
        querySnapshot.forEach(doc => {
          fetchedRequests.push({ id: doc.id, ...doc.data() } as SprayRequest);
        });
        setRequests(fetchedRequests);
        setLoading(false);
      }, error => {
        console.error('Error fetching requests:', error);
        Alert.alert(t('error'), t('failed_to_load_requests'));
        setLoading(false);
      });

    return unsubscribe;
  }, [currentUser, t]);

  useEffect(() => {
    const unsubscribe = fetchRequests();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchRequests]);

  useEffect(() => {
    if (params.refresh === 'true' && !loading) {
      // onSnapshot handles real-time updates, so manual refresh may not be needed
      // If needed, could trigger a one-time .get() here
    }
  }, [params.refresh, loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Firestore onSnapshot handles real-time updates, so no need for manual fetch
    setRefreshing(false);
  }, []);

  const handleRequestPress = (request: SprayRequest): void => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleUpdateStatus = useCallback(async (id: string, newStatus: SprayRequestStatus): Promise<void> => {
    if (!currentUser) return;
    try {
      await firestore().collection('sprayRequests').doc(id).update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      }
      Alert.alert(t('success'), `${t('request_status_updated')} ${t(newStatus.toLowerCase().replace(/ /g, '_')) || newStatus}`);
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert(t('error'), t('failed_to_update_status'));
    }
  }, [currentUser, selectedRequest, t]);

  const getStatusStyle = (status: SprayRequestStatus): string => {
    const styles: Record<SprayRequestStatus, string> = {
      Pending: 'bg-yellow-500', Accepted: 'bg-blue-500', 'In Progress': 'bg-indigo-500',
      Completed: 'bg-green-500', Rejected: 'bg-red-500', Canceled: 'bg-gray-500',
      'Out of Service': 'bg-orange-500', Rescheduled: 'bg-purple-500',
      Placed: 'bg-teal-500', Paid: 'bg-emerald-500', 'On Hold': 'bg-pink-500',
    };
    return styles[status] || 'bg-gray-500';
  };

  const formatDate = (timestamp: FirebaseFirestoreTypes.Timestamp | string): string => {
    if (!timestamp) return t('invalid_date');
    try {
      let date: Date;
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        date = (timestamp as FirebaseFirestoreTypes.Timestamp).toDate();
      }
      if (isNaN(date.getTime())) return t('invalid_date');
      return date.toLocaleDateString(t('locale_code', { defaultValue: 'en-US' }), {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch (e) {
      return t('invalid_date');
    }
  };

  const formatFilterDate = (date: Date | null): string => {
    if (!date) return t('select_date');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const openCalendar = (type: 'start' | 'end'): void => {
    setActiveDateInput(type);
    const initialDate = type === 'start' ? filterStartDate : filterEndDate;
    setSelectedMonth(initialDate || new Date());
    setSelectedDate(initialDate);
    setShowCalendar(true);
  };

  const applySelectedDate = (): void => {
    if (selectedDate) {
      const newSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      if (activeDateInput === 'start') {
        const normalizedEndDate = filterEndDate ? new Date(filterEndDate.getFullYear(), filterEndDate.getMonth(), filterEndDate.getDate(), 23, 59, 59, 999) : null;
        if (normalizedEndDate && newSelectedDate > normalizedEndDate) {
          Alert.alert(t('error'), t('start_date_after_end'));
          return;
        }
        setFilterStartDate(newSelectedDate);
      } else if (activeDateInput === 'end') {
        const normalizedStartDate = filterStartDate ? new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate()) : null;
        if (normalizedStartDate && newSelectedDate < normalizedStartDate) {
          Alert.alert(t('error'), t('end_date_before_start'));
          return;
        }
        setFilterEndDate(newSelectedDate);
      }
    }
    setShowCalendar(false);
    setActiveDateInput(null);
  };

  const generateCalendarDays = (): (number | null)[] => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(42).fill(null);
    for (let i = 0; i < daysInMonth; i++) {
      days[startingDayOfWeek + i] = i + 1;
    }
    return days;
  };

  const renderCalendarDay = (day: number | null, index: number): JSX.Element => {
    if (day === null) {
      return <View key={index} style={tw`w-[${100 / 7}%] aspect-square`} />;
    }
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const isSelected = selectedDate &&
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate();

    return (
      <TouchableOpacity
        key={index}
        style={tw`w-[${100 / 7}%] aspect-square items-center justify-center ${isSelected ? 'bg-blue-600 rounded-full' : ''}`}
        onPress={() => setSelectedDate(date)}
        accessibilityLabel={`${t('select_date')} ${date.toLocaleDateString()}`}
      >
        <Text style={tw`text-sm ${isSelected ? 'text-white' : 'text-gray-800'}`}>{day}</Text>
      </TouchableOpacity>
    );
  };

  const renderWeekdayHeaders = (): JSX.Element[] => {
    const weekdays = [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')];
    return weekdays.map((dayAbbr, index) => (
      <View key={index} style={tw`w-[${100 / 7}%] items-center p-2 mb-1`}>
        <Text style={tw`font-semibold text-gray-600 text-xs`}>{dayAbbr}</Text>
      </View>
    ));
  };

  const goToPreviousMonth = (): void => {
    setSelectedMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = (): void => {
    setSelectedMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1));
  };

  const clearAllFilters = (): void => {
    setFilterStatus(null);
    setFilterStartDate(null);
    setFilterEndDate(null);
    setSearchQuery('');
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  const filteredRequests: SprayRequest[] = requests.filter((request) => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const requestDateFormatted = formatDate(request.sprayingDate).toLowerCase();
      const requestPriceStr = request.price.toString();
      if (!(
        request.address.toLowerCase().includes(query) ||
        request.crop.toLowerCase().includes(query) ||
        request.agrochemical.toLowerCase().includes(query) ||
        request.sprayingDate.toString().toLowerCase().includes(query) ||
        requestDateFormatted.includes(query) ||
        requestPriceStr.includes(query)
      )) {
        return false;
      }
    }
    if (filterStatus && request.status !== filterStatus) {
      return false;
    }
    if (request.sprayingDate) {
      const requestDate = new Date(request.sprayingDate.toDate().setHours(0, 0, 0, 0));
      if (filterStartDate && requestDate < filterStartDate) {
        return false;
      }
      if (filterEndDate) {
        const endOfDayFilter = new Date(filterEndDate.getFullYear(), filterEndDate.getMonth(), filterEndDate.getDate(), 23, 59, 59, 999);
        if (requestDate > endOfDayFilter) {
          return false;
        }
      }
    } else if (filterStartDate || filterEndDate) {
      return false;
    }
    return true;
  });

  const renderRequestItem = ({ item }: { item: SprayRequest }): JSX.Element => (
    <TouchableOpacity
      style={tw`bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200`}
      onPress={() => handleRequestPress(item)}
      accessibilityLabel={`${t('view_details_for')} ${item.crop} at ${item.address}`}
      accessibilityRole="button"
    >
      <View style={tw`flex-row justify-between`}>
        <View style={tw`flex-1 mr-2`}>
          <Text style={tw`text-lg font-semibold text-gray-800`}>{item.crop} {t('spraying')}</Text>
          <Text style={tw`text-gray-600 mt-1 text-sm`}>{item.address}</Text>
          <Text style={tw`text-gray-600 mt-1 text-sm`}>{t('date')}: {formatDate(item.sprayingDate)}</Text>
          <Text style={tw`text-gray-600 mt-1 text-sm`}>{t('area')}: {item.acres} {t('acres')}</Text>
        </View>
        <View style={tw`items-end`}>
          <View style={tw`px-2 py-1 rounded-full ${getStatusStyle(item.status)} mb-2`}>
            <Text style={tw`text-white text-xs font-medium`}>{t(item.status.toLowerCase().replace(/ /g, '_')) || item.status}</Text>
          </View>
          <Text style={tw`font-bold text-base text-blue-700`}>₹{item.price.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = (): JSX.Element => (
    <View style={tw`flex-1 justify-center items-center p-8 bg-gray-100`}>
      <MaterialCommunityIcons name="information-outline" size={48} color={tw.color('gray-400') as string} />
      <Text style={tw`text-lg text-gray-600 text-center mt-4`}>
        {searchQuery.trim() || filterStatus || filterStartDate || filterEndDate
          ? t('no_requests_match_filters')
          : t('no_spray_requests_found')}
      </Text>
      <TouchableOpacity
        style={tw`bg-blue-600 px-6 py-3 rounded-full mt-6 shadow`}
        onPress={() =>
          searchQuery.trim() || filterStatus || filterStartDate || filterEndDate
            ? clearAllFilters()
            : router.push('/Spraying')
        }
        accessibilityLabel={
          searchQuery.trim() || filterStatus || filterStartDate || filterEndDate
            ? t('clear_filters')
            : t('create_new_request')
        }
      >
        <Text style={tw`text-white font-medium`}>
          {searchQuery.trim() || filterStatus || filterStartDate || filterEndDate
            ? t('clear_filters')
            : t('create_new_request')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const RequestDetailModal = (): JSX.Element | null => {
    if (!selectedRequest) return null;

    type DetailItem = {
      icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
      text: string;
      iconSet: 'Ionicons' | 'MaterialCommunityIcons';
      size?: number;
    };

    const details: DetailItem[] = [
      { icon: 'location-outline', text: selectedRequest.address, iconSet: 'Ionicons' },
      { icon: 'calendar-outline', text: formatDate(selectedRequest.sprayingDate), iconSet: 'Ionicons' },
      { icon: 'leaf-outline', text: selectedRequest.crop, iconSet: 'Ionicons' },
      { icon: 'beaker-outline', text: selectedRequest.agrochemical, iconSet: 'MaterialCommunityIcons', size: 18 },
      { icon: 'spray-bottle', text: `${selectedRequest.tanksToSpray} ${t('tanks_to_spray')}`, iconSet: 'MaterialCommunityIcons', size: 18 },
      { icon: 'texture-box', text: `${selectedRequest.acres} ${t('acres')}`, iconSet: 'MaterialCommunityIcons', size: 18 },
      { icon: 'water-pump', text: `${selectedRequest.numberOfTanks} ${t('tanks')}`, iconSet: 'MaterialCommunityIcons', size: 18 },
      { icon: 'time-outline', text: `${t('created_on')} ${formatDate(selectedRequest.createdAt)}`, iconSet: 'Ionicons' },
    ];

    return (
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={tw`flex-1 bg-black bg-opacity-60 justify-end`}>
          <View style={tw`bg-white rounded-t-3xl max-h-[85%] shadow-xl`}>
            <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
              <Text style={tw`text-xl font-semibold text-gray-800`}>{t('request_details')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`p-2`} accessibilityLabel={t('close_modal')}>
                <Ionicons name="close" size={28} color={tw.color('gray-500') as string} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={tw`p-5`}>
              <View style={tw`bg-blue-50 p-4 rounded-xl mb-6 shadow-sm`}>
                <Text style={tw`text-2xl font-bold text-center text-blue-800 mb-2`}>{selectedRequest.crop} {t('spraying')}</Text>
                <View style={tw`flex-row justify-center mb-4`}>
                  <View style={tw`px-3 py-1 rounded-full ${getStatusStyle(selectedRequest.status)}`}>
                    <Text style={tw`text-white text-sm font-medium`}>{t(selectedRequest.status.toLowerCase().replace(/ /g, '_')) || selectedRequest.status}</Text>
                  </View>
                </View>
                {details.map((item, index) => (
                  <View key={index} style={tw`flex-row items-center mb-3.5`}>
                    <View style={tw`w-10 items-center`}>
                      {item.iconSet === 'MaterialCommunityIcons' ? (
                        <MaterialCommunityIcons name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={item.size || 22} color={tw.color('gray-600') as string} />
                      ) : (
                        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={item.size || 22} color={tw.color('gray-600') as string} />
                      )}
                    </View>
                    <Text style={tw`flex-1 text-base text-gray-700 leading-relaxed`}>{item.text}</Text>
                  </View>
                ))}
                <View style={tw`bg-blue-100 p-4 rounded-lg mt-4 border border-blue-200`}>
                  <Text style={tw`text-3xl font-extrabold text-center text-blue-700`}>₹{selectedRequest.price.toFixed(2)}</Text>
                  <Text style={tw`text-center text-blue-600 text-sm font-medium`}>{t('final_price')}</Text>
                </View>
              </View>
              {selectedRequest.status === 'Pending' && (
                <View style={tw`flex-row justify-between mt-2`}>
                  <TouchableOpacity
                    style={tw`flex-1 bg-green-500 p-3.5 rounded-lg mr-2 items-center shadow`}
                    onPress={() => { handleUpdateStatus(selectedRequest.id, 'Accepted'); setModalVisible(false); }}
                    accessibilityLabel={t('accept_request')}
                  >
                    <Text style={tw`text-white font-semibold text-base`}>{t('accept')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tw`flex-1 bg-red-500 p-3.5 rounded-lg ml-2 items-center shadow`}
                    onPress={() => { handleUpdateStatus(selectedRequest.id, 'Rejected'); setModalVisible(false); }}
                    accessibilityLabel={t('reject_request')}
                  >
                    <Text style={tw`text-white font-semibold text-base`}>{t('reject')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {selectedRequest.status === 'Accepted' && (
                <TouchableOpacity
                  style={tw`bg-blue-600 p-3.5 rounded-lg mt-2 items-center shadow`}
                  onPress={() => { handleUpdateStatus(selectedRequest.id, 'Completed'); setModalVisible(false); }}
                  accessibilityLabel={t('mark_request_completed')}
                >
                  <Text style={tw`text-white font-semibold text-base`}>{t('mark_completed')}</Text>
                </TouchableOpacity>
              )}
              {(selectedRequest.status === 'Completed' || selectedRequest.status === 'Paid') && selectedRequest.status !== 'Paid' && (
                <TouchableOpacity
                  style={tw`bg-emerald-500 p-3.5 rounded-lg mt-2 items-center shadow`}
                  onPress={() => { handleUpdateStatus(selectedRequest.id, 'Paid'); setModalVisible(false); }}
                  accessibilityLabel={t('mark_request_paid')}
                >
                  <Text style={tw`text-white font-semibold text-base`}>{t('mark_as_paid')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const FilterModal = (): JSX.Element | null => (
    <Modal visible={filterModalVisible} animationType="slide" transparent={true} onRequestClose={() => setFilterModalVisible(false)}>
      <View style={tw`flex-1 bg-black bg-opacity-60 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl w-full max-h-[75%] p-5 shadow-xl`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-xl font-semibold text-gray-800`}>{t('filters')}</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={tw`p-2`} accessibilityLabel={t('close_modal')}>
              <Ionicons name="close" size={24} color={tw.color('gray-500') as string} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={tw`pb-4`}>
            <View style={tw`mb-6`}>
              <Text style={tw`text-base font-medium text-gray-700 mb-3`}>{t('select_date')}</Text>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`text-gray-600`}>{t('from')}</Text>
                <TouchableOpacity
                  style={tw`border border-gray-300 rounded-lg p-3 w-32 items-center`}
                  onPress={() => openCalendar('start')}
                  accessibilityLabel={`${t('select_start_date')}, ${formatFilterDate(filterStartDate)}`}
                >
                  <Text style={tw`text-gray-800`}>{formatFilterDate(filterStartDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-gray-600`}>{t('to')}</Text>
                <TouchableOpacity
                  style={tw`border border-gray-300 rounded-lg p-3 w-32 items-center`}
                  onPress={() => openCalendar('end')}
                  accessibilityLabel={`${t('select_end_date')}, ${formatFilterDate(filterEndDate)}`}
                >
                  <Text style={tw`text-gray-800`}>{formatFilterDate(filterEndDate)}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={tw`self-end`}
                onPress={clearAllFilters}
                accessibilityLabel={t('clear_all_filters')}
              >
                <Text style={tw`text-blue-600 text-sm`}>{t('clear_all')}</Text>
              </TouchableOpacity>
            </View>
            <View style={tw`h-px bg-gray-200 my-2`} />
            <View style={tw`mb-4`}>
              <Text style={tw`text-base font-medium text-gray-700 mb-3`}>{t('select_status_of_request')}</Text>
              <View style={tw`flex-row flex-wrap`}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={tw`w-1/2 mb-3 flex-row items-center`}
                    onPress={() => setFilterStatus(filterStatus === status ? null : status)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: filterStatus === status }}
                  >
                    <View style={tw`w-5 h-5 border border-gray-400 rounded-sm mr-2 items-center justify-center ${filterStatus === status ? 'bg-blue-500 border-blue-500' : ''}`}>
                      {filterStatus === status && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Text style={tw`text-gray-700`}>{t(status.toLowerCase().replace(/ /g, '_')) || status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={tw`flex-row justify-between mt-4 pt-3 border-t border-gray-200`}>
            <TouchableOpacity
              style={tw`flex-1 border border-gray-300 rounded-lg p-3.5 mr-2 items-center`}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={tw`text-gray-700 font-semibold`}>{t('close')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-blue-600 rounded-lg p-3.5 ml-2 items-center shadow`}
              onPress={() => setFilterModalVisible(false)}
              accessibilityLabel={t('apply_filters_button')}
            >
              <Text style={tw`text-white font-semibold`}>{t('apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const CalendarModal = (): JSX.Element | null => (
    <Modal visible={showCalendar} animationType="fade" transparent={true} onRequestClose={() => setShowCalendar(false)}>
      <View style={tw`flex-1 bg-black bg-opacity-60 justify-center items-center`}>
        <View style={tw`bg-white rounded-2xl w-11/12 p-5 shadow-xl`}>
          <View style={tw`flex-row justify-between items-center mb-5`}>
            <TouchableOpacity onPress={goToPreviousMonth} style={tw`p-2`} accessibilityLabel={t('previous_month')}>
              <Ionicons name="chevron-back" size={28} color={tw.color('blue-600') as string} />
            </TouchableOpacity>
            <Text style={tw`text-lg font-bold text-gray-800`}>
              {selectedMonth.toLocaleString(t('locale_code', { defaultValue: 'en-US' }), { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={tw`p-2`} accessibilityLabel={t('next_month')}>
              <Ionicons name="chevron-forward" size={28} color={tw.color('blue-600') as string} />
            </TouchableOpacity>
          </View>
          <View style={tw`flex-row flex-wrap mb-3`}>
            {renderWeekdayHeaders()}
            {generateCalendarDays().map((day, index) => renderCalendarDay(day, index))}
          </View>
          <View style={tw`flex-row justify-between mt-4 pt-3 border-t border-gray-200`}>
            <TouchableOpacity
              style={tw`py-2 px-4 rounded-md`}
              onPress={() => {
                setSelectedDate(null);
                if (activeDateInput === 'start') setFilterStartDate(null);
                else if (activeDateInput === 'end') setFilterEndDate(null);
              }}
              accessibilityLabel={t('clear_selected_date')}
            >
              <Text style={tw`text-gray-600 font-medium text-base`}>{t('clear')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`bg-blue-600 py-2 px-5 rounded-md shadow`} onPress={applySelectedDate} accessibilityLabel={t('apply_selected_date')}>
              <Text style={tw`text-white font-semibold text-base`}>{t('apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && requests.length === 0) {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-100 justify-center items-center`}>
        <ActivityIndicator size="large" color={tw.color('blue-600') as string} />
        <Text style={tw`text-lg text-gray-500 mt-3`}>{t('loading_requests')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100`}>
      <View style={tw`bg-white p-4 border-b border-gray-200 flex-row justify-between items-center shadow-sm`}>
        <View style={tw`flex-row items-center`}>
          {router.canGoBack() && (
            <TouchableOpacity onPress={() => router.back()} style={tw`mr-3 p-1`} accessibilityLabel={t('go_back')}>
              <Ionicons name="arrow-back" size={26} color={tw.color('gray-700') as string} />
            </TouchableOpacity>
          )}
          <Text style={tw`text-xl font-bold text-gray-800`}>{t('my_spray_requests')}</Text>
        </View>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={tw`p-1`} accessibilityLabel={t('open_filters')}>
          <View style={tw`bg-blue-600 p-2 rounded-full relative shadow`}>
            <Ionicons name="filter-outline" size={20} color="white" />
            {(filterStatus || filterStartDate || filterEndDate || (searchQuery && searchQuery.trim() !== '')) && (
              <View style={tw`absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white`} />
            )}
          </View>
        </TouchableOpacity>
      </View>
      <View style={tw`p-3 bg-white border-b border-gray-200`}>
        <View style={tw`flex-row items-center bg-gray-100 rounded-lg px-3 shadow-sm`}>
          <Ionicons name="search-outline" size={22} color={tw.color('gray-500') as string} style={tw`mr-2`} />
          <TextInput
            style={tw`flex-1 text-base text-gray-800 h-11`}
            placeholder={t('search_requests_placeholder')}
            value={searchQuery}
            onChangeText={debouncedSearch}
            clearButtonMode="never"
            accessibilityLabel={t('search_input_label')}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={tw`p-2`} accessibilityLabel={t('clear_search_input')}>
              <Ionicons name="close-circle" size={20} color={tw.color('gray-500') as string} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {(filterStatus || filterStartDate || filterEndDate) && (
        <View style={tw`bg-blue-50 p-2.5 px-4 flex-row justify-between items-center border-b border-blue-200`}>
          <Text style={tw`text-blue-800 text-xs font-medium flex-1 mr-2`} numberOfLines={1}>
            {[
              filterStatus && `${t('status')}: ${t(filterStatus.toLowerCase().replace(/ /g, '_')) || filterStatus}`,
              filterStartDate && `${t('from_date')}: ${formatFilterDate(filterStartDate)}`,
              filterEndDate && `${t('to_date')}: ${formatFilterDate(filterEndDate)}`,
            ].filter(Boolean).join(';  ')}
          </Text>
          <TouchableOpacity onPress={clearAllFilters} accessibilityLabel={t('clear_active_filters')}>
            <Text style={tw`text-blue-600 font-semibold text-xs`}>{t('clear_all_filters')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`p-4 ${filteredRequests.length === 0 ? 'flex-1 bg-gray-100' : 'bg-gray-100'}`}
        ListEmptyComponent={!loading ? renderEmptyList : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tw.color('blue-600') as string]}
            tintColor={tw.color('blue-600') as string}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      <RequestDetailModal />
      <FilterModal />
      <CalendarModal />
      <TouchableOpacity
        style={tw`absolute right-5 bottom-5 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg active:bg-blue-700`}
        onPress={() => router.push('/Spraying')}
        accessibilityLabel={t('create_new_spray_request_fab')}
        accessibilityRole="button"
      >
        <AntDesign name="plus" size={26} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Requests;