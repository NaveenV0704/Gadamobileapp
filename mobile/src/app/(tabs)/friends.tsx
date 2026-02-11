import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../constants/config";
import { Friend, FriendRequest, getPeopleYouMayKnow, getFriendRequests, getYourFriends, searchFriends, sendFriendRequest, respondToFriendRequest } from "../../services/friends.service";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { StatusBar } from "expo-status-bar";
import { Toast } from "../../components/Toast";

const UserCard = ({ user, onAddFriend }: { user: Friend, onAddFriend: (id: number | string) => void }) => {
  const imageUrl = user.profileImage?.startsWith("http") 
        ? user.profileImage 
        : user.profileImage?.startsWith("/")
            ? `${API_BASE_URL}${user.profileImage}`
            : `${API_BASE_URL}/${user.profileImage}`;

  const displayImage = user.profileImage ? { uri: imageUrl } : { uri: "https://via.placeholder.com/150" };

  return (
    <View className="bg-gray-50 rounded-2xl p-4 items-center border border-gray-100 mr-4 w-40">
      <View className="mb-3 relative">
        <View className="w-20 h-20 rounded-full bg-white items-center justify-center overflow-hidden border border-gray-200">
             <Image
              source={displayImage}
              className="w-full h-full"
              resizeMode="cover"
            />
        </View>
      </View>
      
      <Text className="text-base font-bold text-gray-900 text-center mb-1" numberOfLines={1}>
        {user.user_name}
      </Text>
      <Text className="text-xs text-gray-400 text-center mb-3">Suggested</Text>

      <TouchableOpacity 
        className="bg-slate-900 px-4 py-2.5 rounded-xl w-full active:opacity-90"
        onPress={() => onAddFriend(user.user_id)}
      >
        <Text className="text-white text-center font-bold text-sm">
         Add Friend
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const FriendRequestItem = ({ request, onAccept, onDecline }: { request: FriendRequest, onAccept: (id: number, userId: number | string) => void, onDecline: (id: number, userId: number | string) => void }) => {
    const imageUrl = request.fromProfileImage?.startsWith("http")
          ? request.fromProfileImage
          : request.fromProfileImage?.startsWith("/")
              ? `${API_BASE_URL}${request.fromProfileImage}`
              : `${API_BASE_URL}/${request.fromProfileImage}`;
  
    const displayImage = request.fromProfileImage ? { uri: imageUrl } : { uri: "https://via.placeholder.com/150" };
  
    return (
      <View className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-white items-center justify-center overflow-hidden mr-3 border border-gray-200">
             <Image
                source={displayImage}
                className="w-full h-full"
                resizeMode="cover"
             />
          </View>
          <Text className="text-base font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
            {request.fromUsername}
          </Text>
        </View>
  
        <View className="flex-row items-center space-x-2 gap-2">
            <TouchableOpacity 
                className="bg-slate-900 px-4 py-2 rounded-lg active:opacity-90"
                onPress={() => onAccept(request.id, request.fromUserId)}
            >
                <Text className="text-white font-bold text-xs">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                className="bg-white border border-gray-200 px-4 py-2 rounded-lg active:opacity-50"
                onPress={() => onDecline(request.id, request.fromUserId)}
            >
                <Text className="text-gray-700 font-bold text-xs">Decline</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

export default function Friends() {
  const { accessToken } = useAuth();
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [yourFriends, setYourFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    if (accessToken) {
        loadData();
    }
  }, [accessToken]);

  const loadData = async () => {
    // Keep loading true only on initial load if needed, or manage separate loading states
    // For now, simple loading state
    // setLoading(true); // Optional: don't block UI if refreshing silently
    try {
      const [suggestions, requests, friends] = await Promise.all([
         getPeopleYouMayKnow(accessToken || undefined),
         getFriendRequests(accessToken || undefined),
         getYourFriends(accessToken || undefined)
      ]);
      setPeopleYouMayKnow(suggestions);
      setFriendRequests(requests);
      setYourFriends(friends);
    } catch (error) {
      console.error("Failed to load friend data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [accessToken]);

  const handleAddFriend = async (userId: number | string) => {
      try {
          // @ts-ignore
          await sendFriendRequest(userId, accessToken);
          showToast("Friend request sent successfully!", "success");
          
          // Refresh suggestions
          loadData();

      } catch (error: any) {
          console.error("Add friend failed:", error);
          showToast(error.message || "Failed to send friend request", "error");
      }
  };

  const handleAcceptRequest = async (requestId: number, userId: number | string) => {
    try {
        // Optimistically remove from list immediately
        setFriendRequests(current => current.filter(req => req.id !== requestId));

        // @ts-ignore
        await respondToFriendRequest(requestId, "accepted", accessToken);
        showToast("Friend request accepted!", "success");
        
        // Fetch fresh data but manually filter out the accepted request from the result
        // This ensures that even if the server returns the old request (stale data), we don't show it again.
        const [suggestions, requests, friends] = await Promise.all([
             getPeopleYouMayKnow(accessToken || undefined),
             getFriendRequests(accessToken || undefined),
             getYourFriends(accessToken || undefined)
        ]);
        
        setPeopleYouMayKnow(suggestions);
        setFriendRequests(requests.filter(req => req.id !== requestId));
        setYourFriends(friends);

    } catch (error: any) {
        console.error("Accept request failed:", error);
        showToast(error.message || "Failed to accept request", "error");
        // Re-load data in case of error to restore state
        loadData();
    }
  };

  const handleDeclineRequest = async (requestId: number, userId: number | string) => {
    try {
        // Optimistically remove from list immediately
        setFriendRequests(current => current.filter(req => req.id !== requestId));

        // @ts-ignore
        await respondToFriendRequest(requestId, "declined", accessToken);
        showToast("Friend request declined", "success");
        
        // Fetch fresh data but manually filter out the accepted request from the result
        // This ensures that even if the server returns the old request (stale data), we don't show it again.
        const [suggestions, requests, friends] = await Promise.all([
             getPeopleYouMayKnow(accessToken || undefined),
             getFriendRequests(accessToken || undefined),
             getYourFriends(accessToken || undefined)
        ]);
        
        setPeopleYouMayKnow(suggestions);
        setFriendRequests(requests.filter(req => req.id !== requestId));
        setYourFriends(friends);

    } catch (error: any) {
        console.error("Decline request failed:", error);
        showToast(error.message || "Failed to decline request", "error");
        // Re-load data in case of error to restore state
        loadData();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults(null); // Clear previous results
    try {
        // @ts-ignore
        const results = await searchFriends(searchQuery, accessToken);
        setSearchResults(results);
    } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Toast Component */}
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType}
        onHide={() => setToastVisible(false)} 
      />

      {/* Header - White Background, Black Text */}
      <View className="px-6 py-4 bg-white">
        <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">Friends</Text>
      </View>
      
      {/* Main Content - Purple Background */}
      <View className="flex-1" style={{ backgroundColor: '#8e4de0' }}>
        <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
            }
        >
            
            <View className="px-4 space-y-5 gap-5">

                {/* People You May Know - Now in White Card */}
                <View className="bg-white rounded-3xl p-5 shadow-sm">
                    <Text className="text-lg font-bold text-gray-900 mb-4">People You May Know</Text>
                    
                    {loading && peopleYouMayKnow.length === 0 ? (
                        <ActivityIndicator size="small" color="#000000" />
                    ) : (
                        <FlatList
                            horizontal
                            data={peopleYouMayKnow}
                            renderItem={({ item }) => <UserCard user={item} onAddFriend={handleAddFriend} />}
                            keyExtractor={(item) => item.user_id.toString()}
                            showsHorizontalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text className="text-gray-400 italic">No suggestions available.</Text>
                            }
                        />
                    )}
                </View>

                {/* Friend Requests Card */}
                <View className="bg-white rounded-3xl p-5 shadow-sm">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-bold text-gray-900">Friend Requests</Text>
                        {friendRequests.length > 0 && (
                            <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                                <Text className="text-gray-900 text-xs font-bold">{friendRequests.length}</Text>
                            </View>
                        )}
                    </View>
                    
                    {loading && friendRequests.length === 0 ? (
                        <ActivityIndicator size="small" color="#000000" />
                    ) : friendRequests.length > 0 ? (
                        <View className="max-h-80">
                            <ScrollView 
                                nestedScrollEnabled={true}
                                showsVerticalScrollIndicator={true}
                                contentContainerStyle={{ paddingBottom: 8 }}
                            >
                                {friendRequests.map(request => (
                                    <FriendRequestItem 
                                        key={request.id} 
                                        request={request} 
                                        onAccept={handleAcceptRequest}
                                        onDecline={handleDeclineRequest}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    ) : (
                        <View className="py-2">
                            <Text className="text-gray-400">No pending friend requests.</Text>
                        </View>
                    )}
                </View>

                {/* Find Friends Card */}
                <View className="bg-white rounded-3xl p-5 shadow-sm">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Find Friends</Text>
                    <View className="flex-row items-center gap-3 mb-4">
                        <TextInput 
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
                            placeholder="Find friends"
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />
                        <TouchableOpacity 
                            className="bg-slate-900 px-6 py-3.5 rounded-lg active:opacity-90 shadow-sm"
                            onPress={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text className="text-white font-bold text-sm">Search</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    
                    {/* Search Results */}
                    {searchResults !== null && (
                        <View>
                            {searchResults.length > 0 ? (
                                <View>
                                    {searchResults.map((user) => (
                                        <View key={user.user_id} className="bg-gray-50 rounded-xl p-3 mb-2 flex-row items-center justify-between border border-gray-50">
                                            <View className="flex-row items-center flex-1">
                                                <View className="w-10 h-10 rounded-full bg-white items-center justify-center overflow-hidden mr-3 border border-gray-200">
                                                    <Image
                                                        source={{ 
                                                            uri: user.profileImage?.startsWith("http") 
                                                                ? user.profileImage 
                                                                : user.profileImage?.startsWith("/")
                                                                    ? `${API_BASE_URL}${user.profileImage}`
                                                                    : `${API_BASE_URL}/${user.profileImage}` || "https://via.placeholder.com/150"
                                                        }}
                                                        className="w-full h-full"
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                                <Text className="text-sm font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                                                    {user.user_name}
                                                </Text>
                                            </View>
                                            <TouchableOpacity 
                                                className="bg-slate-900 px-4 py-2 rounded-lg active:opacity-90"
                                                onPress={() => handleAddFriend(user.user_id)}
                                            >
                                                <Text className="text-white font-bold text-xs">Add Friend</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text className="text-gray-400 mt-2 text-center italic">No users found.</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Your Friends Card */}
                <View className="bg-white rounded-3xl p-5 shadow-sm min-h-[200px]">
                    <View className="flex-row items-center gap-3 mb-8">
                        <Text className="text-lg font-bold text-gray-900">Your Friends</Text>
                        <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                            <Text className="text-gray-600 text-xs font-bold">{yourFriends.length}</Text>
                        </View>
                    </View>

                    {loading && yourFriends.length === 0 ? (
                        <ActivityIndicator size="small" color="#000000" />
                    ) : yourFriends.length > 0 ? (
                        <View className="flex-row flex-wrap justify-between">
                            {yourFriends.map((friend) => (
                                <View key={friend.user_id} className="w-[30%] items-center mb-6">
                                    <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center overflow-hidden mb-2 border border-gray-100">
                                        <Image
                                            source={{ 
                                                uri: friend.profileImage?.startsWith("http") 
                                                    ? friend.profileImage 
                                                    : friend.profileImage?.startsWith("/")
                                                        ? `${API_BASE_URL}${friend.profileImage}`
                                                        : `${API_BASE_URL}/${friend.profileImage}` 
                                            }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <Text className="text-xs font-medium text-gray-700 text-center" numberOfLines={1}>
                                        {friend.user_name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="py-8 items-center">
                            <Text className="text-gray-400">You haven't added any friends yet.</Text>
                        </View>
                    )}

                    <View className="items-end mt-auto pt-4">
                        <TouchableOpacity className="bg-gray-500 px-6 py-2 rounded-lg active:opacity-90">
                            <Text className="text-white font-bold text-xs">Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
