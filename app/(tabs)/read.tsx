// app/(tabs)/read.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, Linking,
  ActivityIndicator, StyleSheet, Alert, SafeAreaView
} from 'react-native';
import { useAuth } from '../contexts/UserContext'; // Adjust path if needed
import firestore from '@react-native-firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import tw from '@/tailwind'; // Adjust path if needed
import { Stack } from 'expo-router';

const NEWS_API_KEY = 'b6d8beb3cce94a0b864a957417cd8b82'; // <-- REPLACE THIS!
const ARTICLES_PER_PAGE = 20;

interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface Article extends NewsApiArticle {
  id: string; // We'll use the URL as a unique ID for our purposes
  isLikedByCurrentUser?: boolean;
}

// Function to create a Firestore-safe ID from a URL
const getArticleDocId = (url: string): string => {
  // Replace characters not allowed in Firestore document IDs
  // This is a basic example; a more robust hashing might be better for very long/complex URLs
  return url.replace(/[.#$[\]/]/g, '_');
};

export default function ReadScreen() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedArticleIds, setLikedArticleIds] = useState<Set<string>>(new Set());

  const fetchUserLikes = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userLikesSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('likedArticles')
        .get();

      const likedIds = new Set<string>();
      userLikesSnapshot.forEach(doc => {
        // Assuming doc.id is the sanitized article URL (our article.id)
        likedIds.add(doc.id);
      });
      setLikedArticleIds(likedIds);
    } catch (e) {
      console.error("Error fetching user likes:", e);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserLikes();
  }, [fetchUserLikes]);

  const fetchArticlesFromAPI = useCallback(async (pageNum: number) => {
    if (!hasMoreArticles && pageNum > 1) return; // Don't fetch if no more and not the first page

    console.log(`Fetching articles, page: ${pageNum}`);
    setError(null);
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    const keywords = "agriculture OR agritech OR \"farm technology\" OR \"precision farming\" OR \"sustainable farming\"";
    const url = `https://newsapi.org/v2/everything?q=(${keywords})&sortBy=publishedAt&language=en&pageSize=${ARTICLES_PER_PAGE}&page=${pageNum}&apiKey=${NEWS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message || 'Failed to fetch articles from News API');
      }

      if (data.articles && data.articles.length > 0) {
        const newArticles: Article[] = data.articles
          .filter((art: NewsApiArticle) => art.url && art.title && art.urlToImage) // Basic filter for usable articles
          .map((art: NewsApiArticle) => ({
            ...art,
            id: getArticleDocId(art.url), // Use sanitized URL as our internal ID
            isLikedByCurrentUser: likedArticleIds.has(getArticleDocId(art.url)),
          }));

        setArticles(prev => pageNum === 1 ? newArticles : [...prev, ...newArticles]);
        setHasMoreArticles(newArticles.length === ARTICLES_PER_PAGE);
      } else {
        setHasMoreArticles(false);
        if (pageNum === 1) setArticles([]); // Clear if first page has no results
      }
    } catch (e: any) {
      console.error("Error fetching articles:", e);
      setError(e.message || t('failed_to_load_articles'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [hasMoreArticles, likedArticleIds, t]); // Include likedArticleIds so articles re-evaluate like status if likes load later

  useEffect(() => {
    fetchArticlesFromAPI(1); // Initial fetch
  }, [fetchArticlesFromAPI]); // fetchArticlesFromAPI is memoized with likedArticleIds as dependency

  const handleLikeToggle = async (article: Article) => {
    if (!currentUser) {
      Alert.alert(t('login_required'), t('please_login_to_like'));
      return;
    }

    const articleDocId = article.id; // This is already the sanitized ID
    const userLikesRef = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('likedArticles')
      .doc(articleDocId);

    const newLikedStatus = !article.isLikedByCurrentUser;

    try {
      if (newLikedStatus) {
        await userLikesRef.set({
          url: article.url, // Store original URL for reference
          title: article.title,
          likedAt: firestore.FieldValue.serverTimestamp(),
          // You can add article.urlToImage, article.source.name if needed
        });
      } else {
        await userLikesRef.delete();
      }

      // Update local state optimistically
      setArticles(prevArticles =>
        prevArticles.map(art =>
          art.id === article.id ? { ...art, isLikedByCurrentUser: newLikedStatus } : art
        )
      );
      setLikedArticleIds(prev => {
        const newSet = new Set(prev);
        if (newLikedStatus) newSet.add(articleDocId);
        else newSet.delete(articleDocId);
        return newSet;
      });

    } catch (e) {
      console.error("Error toggling like:", e);
      Alert.alert(t('error'), t('failed_to_update_like'));
    }
  };

  const openArticleUrl = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('error'), `${t('cannot_open_url')}: ${url}`);
      }
    }).catch(err => {
      console.error("Error opening URL", err);
      Alert.alert(t('error'), t('failed_to_open_link'));
    });
  };

  const renderArticleItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[tw`bg-white mb-4 rounded-lg shadow-lg overflow-hidden`, styles.articleCard]}
      onPress={() => openArticleUrl(item.url)}
    >
      {item.urlToImage && (
        <Image source={{ uri: item.urlToImage }} style={styles.articleImage} resizeMode="cover" />
      )}
      <View style={tw`p-4`}>
        <Text style={[tw`text-lg font-semibold text-gray-800 mb-1`, { fontFamily: "Inter_600SemiBold" }]}>{item.title}</Text>
        {item.source?.name && <Text style={tw`text-xs text-gray-500 mb-2`}>{item.source.name} - {new Date(item.publishedAt).toLocaleDateString()}</Text>}
        <Text style={[tw`text-sm text-gray-700 mb-3`, { fontFamily: "Inter_400Regular" }]} numberOfLines={3}>
          {item.description || item.content?.substring(0, 150) || t('no_description')}
        </Text>
        <View style={tw`flex-row justify-between items-center`}>
          <TouchableOpacity onPress={() => handleLikeToggle(item)} style={tw`p-2 -ml-2`}>
            <Ionicons
              name={item.isLikedByCurrentUser ? "heart" : "heart-outline"}
              size={26}
              color={item.isLikedByCurrentUser ? tw.color('red-500') : tw.color('gray-600')}
            />
          </TouchableOpacity>
          <Text style={tw`text-blue-600 font-medium`} onPress={() => openArticleUrl(item.url)}>
            {t('read_full_article')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const loadMoreArticles = () => {
    if (!loadingMore && hasMoreArticles) {
      setPage(prevPage => {
        const nextPage = prevPage + 1;
        fetchArticlesFromAPI(nextPage);
        return nextPage;
      });
    }
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-100`}>
        <ActivityIndicator size="large" color={tw.color('blue-600')} />
        <Text style={tw`mt-2 text-gray-600`}>{t('loading_articles')}</Text>
      </SafeAreaView>
    );
  }

  if (error && articles.length === 0) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-100 p-5`}>
        <Ionicons name="alert-circle-outline" size={48} color={tw.color('red-500')} />
        <Text style={tw`mt-3 text-lg text-red-600 text-center font-semibold`}>{t('error_occurred')}</Text>
        <Text style={tw`mt-1 text-gray-700 text-center`}>{error}</Text>
        <TouchableOpacity
          onPress={() => { setPage(1); fetchArticlesFromAPI(1); }}
          style={tw`mt-4 bg-blue-500 px-6 py-2 rounded-lg`}
        >
          <Text style={tw`text-white font-medium`}>{t('retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100`}>
      <Stack.Screen options={{ title: t('read_latest_agritech') }} />
      <FlatList
        data={articles}
        renderItem={renderArticleItem}
        keyExtractor={(item) => item.url} // URL should be unique
        contentContainerStyle={tw`p-4`}
        onEndReached={loadMoreArticles}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={tw.color('gray-500')} style={tw`my-4`} /> : null}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={tw`flex-1 justify-center items-center mt-20`}>
              <Ionicons name="newspaper-outline" size={60} color={tw.color('gray-400')} />
              <Text style={tw`mt-4 text-lg text-gray-500`}>{t('no_articles_found')}</Text>
              <Text style={tw`mt-1 text-sm text-gray-400`}>{t('try_again_later_or_check_keywords')}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  articleCard: {
    // elevation: 3, // For Android shadow
  },
  articleImage: {
    width: '100%',
    height: 180,
  },
});