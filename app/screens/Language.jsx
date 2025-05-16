import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

export default function LanguageSettings() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  ];

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: t('languageSettings'),
          headerBackTitle: t('back'),
          headerTitleStyle: {
            fontWeight: '600',
          }
        }} 
      />
      
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchLanguages')}
          placeholderTextColor="#8e8e93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{t('selectPreferredLanguage')}</Text>
        <Text style={styles.subtitle}>{t('languageSelectionDescription')}</Text>
        
        <View style={styles.languagesContainer}>
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((language) => (
              <TouchableOpacity 
                key={language.code}
                style={[
                  styles.languageButton,
                  i18n.language === language.code && styles.selectedLanguage
                ]}
                onPress={() => changeLanguage(language.code)}
              >
                <View style={styles.languageContent}>
                  <View>
                    <Text style={styles.languageName}>{language.name}</Text>
                    <Text style={styles.languageNativeName}>{language.nativeName}</Text>
                  </View>
                  {i18n.language === language.code && (
                    <MaterialIcons name="check" size={24} color="#007AFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResults}>
              <MaterialIcons name="error-outline" size={24} color="#8e8e93" />
              <Text style={styles.noResultsText}>{t('noLanguagesFound')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1c1c1e',
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1c1c1e',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    color: '#636366',
    lineHeight: 22,
  },
  languagesContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  languageButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  selectedLanguage: {
    backgroundColor: '#f5f5f7',
  },
  languageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageName: {
    fontSize: 17,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  languageNativeName: {
    fontSize: 15,
    color: '#636366',
    marginTop: 2,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  noResultsText: {
    marginLeft: 8,
    color: '#8e8e93',
    fontSize: 16,
  },
});