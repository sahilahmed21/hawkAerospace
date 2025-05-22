import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator,
  StyleSheet, Linking, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import tw from '@/tailwind';
import { useAuth } from '../contexts/UserContext';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';

// --- CONFIGURATION ---
const GNEWS_API_KEY = 'de35eeb02de05b2676b7be46f340259d'; // REPLACE WITH YOUR GNEWS API KEY
const GNEWS_BASE_URL = 'https://gnews.io/api/v4/search';
const ARTICLES_PER_PAGE = 20;

interface GNewsArticleSource {
  name: string;
  url: string;
}

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: GNewsArticleSource;
}

interface ArticleUIState extends GNewsArticle {
  isLikedByCurrentUser: boolean;
}

const createArticleId = (url: string): string => {
  return url.replace(/[.#$[\]/]/g, '_');
};

const ReadScreen = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [articles, setArticles] = useState<ArticleUIState[]>([]);
  const [likedArticleIds, setLikedArticleIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedInitial = useRef(false);

  const fetchUserLikes = useCallback(async () => {
    if (!currentUser) {
      console.log("[ReadScreen] No user for likes, skipping fetchUserLikes.");
      setLikedArticleIds(new Set());
      return;
    }
    console.log("[ReadScreen] Fetching user likes for:", currentUser.uid);
    try {
      const userLikesSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('likedArticles')
        .get();
      const likedIds = new Set<string>();
      userLikesSnapshot.forEach(doc => {
        likedIds.add(doc.id);
      });
      setLikedArticleIds(likedIds);
      console.log("[ReadScreen] User likes fetched:", likedIds.size);
    } catch (e) {
      console.error("[ReadScreen] Error fetching user likes:", e);
    }
  }, [currentUser]);

  const fetchArticles = useCallback(async (isRefresh: boolean = false) => {
    if (GNEWS_API_KEY === 'YOUR_GNEWS_API_KEY_HERE') {
      console.log("[ReadScreen] Missing GNews API key.");
      setError(t('gnews_api_key_missing'));
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    setError(null);
    if (!isRefresh) setIsLoading(true);
    else console.log("[ReadScreen] Refreshing articles.");

    const queryKeywords = "((agriculture OR agritech OR \"farm technology\" OR \"kisan drone\") AND (India OR Indian)) OR \"कृषि ड्रोन भारत\" OR \"भारतीय कृषि प्रौद्योगिकी\"";
    const url = `${GNEWS_BASE_URL}?q=${encodeURIComponent(queryKeywords)}&lang=en&country=in&max=${ARTICLES_PER_PAGE}&apikey=${GNEWS_API_KEY}&expand=content&sortby=publishedAt`;

    try {
      console.log("[ReadScreen] Fetching GNews from:", url);
      const response = await fetch(url);
      const data = await response.json();
      console.log("[ReadScreen] GNews response status:", response.status);

      if (!response.ok || data.errors || !data.articles) {
        const errorMessage = data.errors ? data.errors.join(', ') : `HTTP error ${response.status}`;
        console.error("[ReadScreen] GNews API Error:", errorMessage, data);
        throw new Error(errorMessage);
      }

      if (data.articles && Array.isArray(data.articles)) {
        const uiArticles = data.articles
          .filter((article: GNewsArticle) => article.url && article.title)
          .map((article: GNewsArticle) => ({
            ...article,
            isLikedByCurrentUser: likedArticleIds.has(createArticleId(article.url)),
          }));
        console.log("[ReadScreen] Articles fetched and processed:", uiArticles.length);
        setArticles(uiArticles);
      } else {
        console.log("[ReadScreen] No articles in GNews response or not an array.");
        setArticles([]);
      }
    } catch (e: any) {
      console.error("[ReadScreen] Error fetching GNews articles:", e);
      setError(e.message || t('failed_to_fetch_articles'));
      setArticles([]);
    } finally {
      console.log("[ReadScreen] Fetch articles complete. Setting loading states to false.");
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [likedArticleIds, t]);

  useEffect(() => {
    console.log("[ReadScreen] Mount/currentUser effect. CurrentUser:", currentUser ? currentUser.uid : "null");
    const initialize = async () => {
      if (hasFetchedInitial.current) {
        console.log("[ReadScreen] Initial fetch already done, skipping.");
        return;
      }
      hasFetchedInitial.current = true;
      if (currentUser) {
        await fetchUserLikes();
      }
      await fetchArticles();
    };
    initialize();
  }, [currentUser, fetchUserLikes, fetchArticles]);

  useEffect(() => {
    console.log("[ReadScreen] Updating article like status due to likedArticleIds change:", likedArticleIds.size);
    setArticles(prevArticles =>
      prevArticles.map(article => ({
        ...article,
        isLikedByCurrentUser: likedArticleIds.has(createArticleId(article.url)),
      }))
    );
  }, [likedArticleIds]);

  const onRefresh = useCallback(() => {
    console.log("[ReadScreen] Pull-to-refresh triggered.");
    setIsRefreshing(true);
    fetchArticles(true);
  }, [fetchArticles]);

  const handleLikeToggle = async (articleUrl: string, articleTitle: string, currentLikeStatus: boolean) => {
    if (!currentUser) {
      console.log("[ReadScreen] Like attempted without user.");
      Alert.alert(t('login_required'), t('please_login_to_like'));
      return;
    }

    const articleIdForFirestore = createArticleId(articleUrl);
    const likeDocRef = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('likedArticles')
      .doc(articleIdForFirestore);

    const newLikedStatus = !currentLikeStatus;
    console.log("[ReadScreen] Toggling like for article:", articleUrl, "to", newLikedStatus);
    setArticles(prevArticles =>
      prevArticles.map(a =>
        a.url === articleUrl ? { ...a, isLikedByCurrentUser: newLikedStatus } : a
      )
    );
    setLikedArticleIds(prevSet => {
      const newSet = new Set(prevSet);
      if (newLikedStatus) newSet.add(articleIdForFirestore);
      else newSet.delete(articleIdForFirestore);
      return newSet;
    });

    try {
      if (newLikedStatus) {
        await likeDocRef.set({
          url: articleUrl,
          title: articleTitle,
          likedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log("[ReadScreen] Like saved to Firestore:", articleIdForFirestore);
      } else {
        await likeDocRef.delete();
        console.log("[ReadScreen] Like removed from Firestore:", articleIdForFirestore);
      }
    } catch (e) {
      console.error("[ReadScreen] Error updating like status:", e);
      Alert.alert(t('error'), t('failed_to_update_like'));
      setArticles(prevArticles =>
        prevArticles.map(a =>
          a.url === articleUrl ? { ...a, isLikedByCurrentUser: currentLikeStatus } : a
        )
      );
      setLikedArticleIds(prevSet => {
        const newSet = new Set(prevSet);
        if (currentLikeStatus) newSet.add(articleIdForFirestore);
        else newSet.delete(articleIdForFirestore);
        return newSet;
      });
    }
  };

  const openArticleLink = (url: string) => {
    console.log("[ReadScreen] Opening article link:", url);
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.error("[ReadScreen] Cannot open URL:", url);
        Alert.alert(t('error'), `${t('cannot_open_link')} ${url}`);
      }
    }).catch(err => {
      console.error("[ReadScreen] Error opening link:", err);
      Alert.alert(t('error'), t('failed_to_open_link'));
    });
  };

  const renderArticleCard = ({ item }: { item: ArticleUIState }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openArticleLink(item.url)}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={3}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardSource}>{item.source.name} - {new Date(item.publishedAt).toLocaleDateString()}</Text>
          <TouchableOpacity
            onPress={() => handleLikeToggle(item.url, item.title, item.isLikedByCurrentUser)}
            style={styles.likeButton}
          >
            <AntDesign
              name={item.isLikedByCurrentUser ? "heart" : "hearto"}
              size={22}
              color={item.isLikedByCurrentUser ? tw.color('red-500') : tw.color('gray-500')}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && articles.length === 0 && !isRefreshing) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={tw.color('green-600')} />
        <Text style={styles.loadingText}>{t('loading_articles')}</Text>
      </SafeAreaView>
    );
  }

  if (error && articles.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={tw.color('red-500')} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('read_agri_news') }} />
      <FlatList
        data={articles}
        renderItem={renderArticleCard}
        keyExtractor={(item) => item.url}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={
          !isLoading && !isRefreshing ? (
            <View style={styles.centered}>
              <Ionicons name="newspaper-outline" size={48} color={tw.color('gray-400')} />
              <Text style={styles.emptyText}>{t('no_articles_found')}</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[tw.color('green-600')!]} tintColor={tw.color('green-600')} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tw.color('gray-100'),
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: tw.color('gray-600'),
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: tw.color('red-600'),
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: tw.color('green-600'),
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: tw.color('gray-800'),
    marginBottom: 5,
    fontFamily: 'Inter_700Bold',
  },
  cardDescription: {
    fontSize: 14,
    color: tw.color('gray-600'),
    marginBottom: 10,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  cardSource: {
    fontSize: 12,
    color: tw.color('gray-500'),
    fontFamily: 'Inter_500Medium',
    flexShrink: 1,
    marginRight: 8,
  },
  likeButton: {
    padding: 5,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: tw.color('gray-500'),
  },
});

export default ReadScreen;