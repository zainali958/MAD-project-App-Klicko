import { Platform } from 'react-native';
import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Provider as PaperProvider,
  Appbar,
  Button,
  Card,
} from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// ✅ Fix: custom event emitter (replaces Node's "events")
class Emitter {
  private listeners: Record<string, (() => void)[]> = {};
  on(event: string, fn: () => void) {
    (this.listeners[event] = this.listeners[event] || []).push(fn);
  }
  off(event: string, fn: () => void) {
    this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== fn);
  }
  emit(event: string) {
    (this.listeners[event] || []).forEach((fn) => fn());
  }
}
const cartEvents = new Emitter();

// ✅ Updated: Use your Vercel backend URL for all platforms
export const API = 'https://ecommerce-apk-opal.vercel.app';
type Product = {
  _id: string;
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------- LOGIN ---------- */
function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "All fields required.");
    try {
      setLoading(true);
      const res = await axios.post(`${API}/login`, { email, password });
      await AsyncStorage.setItem("token", res.data.token);
      navigation.replace("Main");
    } catch (err: any) {
      const message =
        err?.response?.data?.error || "Invalid credentials or server error";
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.containerCenter}>
      <View style={styles.logoWrapper}>
        <Text style={styles.title}>✨ KLICKO</Text>
        <Text style={styles.subtitle}>Luxury fashion at your fingertips</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.primaryBtn}
        labelStyle={styles.buttonLabel}
      >
        Sign In
      </Button>
      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>New to VogueVault? <Text style={styles.linkBold}>Create account</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------- SIGNUP ---------- */
function SignupScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password)
      return Alert.alert("Error", "All fields required.");
    try {
      setLoading(true);
      const res = await axios.post(`${API}/signup`, {
        name,
        email,
        password,
        role,
      });
      await AsyncStorage.setItem("token", res.data.token);
      navigation.replace("Main");
    } catch (err: any) {
      const message = err?.response?.data?.error || "Server error";
      Alert.alert("Signup failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.containerCenter}>
      <Text style={styles.title}>✨ Join KLICKO</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 20, gap: 12 }}>
        <TouchableOpacity
          onPress={() => setRole("buyer")}
          style={[styles.roleBtn, role === "buyer" && styles.roleBtnActive]}
        >
          <Text style={[styles.roleText, role === "buyer" && styles.roleTextActive]}>
            🛍️ Buyer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRole("seller")}
          style={[styles.roleBtn, role === "seller" && styles.roleBtnActive]}
        >
          <Text style={[styles.roleText, role === "seller" && styles.roleTextActive]}>
            📦 Seller
          </Text>
        </TouchableOpacity>
      </View>
      <Button
        mode="contained"
        onPress={handleSignup}
        loading={loading}
        style={styles.primaryBtn}
        labelStyle={styles.buttonLabel}
      >
        Create Account
      </Button>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------- HOME SCREEN ---------- */
function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/products`);
        const data = Array.isArray(res.data) ? res.data : res.data.products || [];
        setProducts(data);
        const cats = Array.from(new Set(data.map((p: any) => String(p.category || "Other")))) as string[];
        setCategories(cats);
      } catch (err) {
        console.error("Product load error:", err);
        setError("Failed to load products. Check backend or API URL.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    );

  if (error)
    return (
      <View style={styles.loading}>
        <Text style={{ color: "#666", marginBottom: 16 }}>{error}</Text>
        <Button mode="contained" onPress={() => navigation.replace("Login")} style={styles.primaryBtn}>
          Back to Login
        </Button>
      </View>
    );

  const filtered = products.filter((p) => {
    const matchesCategory =
      !selectedCat || selectedCat === "All" || p.category === selectedCat;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F0" }}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="KLICKO" titleStyle={styles.headerTitle} />
        <Appbar.Action
          icon="cart"
          onPress={() => navigation.navigate("Cart")}
          color="#1A1A1A"
        />
      </Appbar.Header>

      {/* 🔍 Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Chips */}
      <View style={{ paddingVertical: 12, backgroundColor: "#F5F5F0" }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", ...categories]}
          keyExtractor={(i) => String(i)}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCat(item)}
              style={[styles.chip, selectedCat === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedCat === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Products */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i._id)}
        numColumns={2}
        contentContainerStyle={{ padding: 8, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const rating = Math.floor(Math.random() * 3) + 3;
          const priceValue =
            typeof item.price === "number"
              ? item.price.toFixed(2)
              : parseFloat(item.price).toFixed(2);

          return (
            <View style={{ flex: 1 / 2, padding: 8 }}>
              <Card
                style={styles.productCard}
                onPress={() => navigation.navigate("Details", { product: item })}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{
                      uri: item.image_url.startsWith("http")
                        ? item.image_url
                        : `${API}/uploads/${item.image_url}`,
                    }}
                    style={styles.productImage}
                  />
                </View>
                <Card.Content style={styles.productContent}>
                  <Text style={styles.pName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.price}>${priceValue}</Text>
                  <View style={{ flexDirection: "row", marginTop: 6 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Text
                        key={i}
                        style={{
                          color: i < rating ? "#C9A96E" : "#E0E0E0",
                          fontSize: 13,
                        }}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

/* ---------- DETAILS ---------- */
function DetailsScreen({ route, navigation }: any) {
  const { product } = route.params as { product: Product };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F0", padding: 16 }}>
      <View style={styles.detailImageContainer}>
        <Image
          source={{ uri: product.image_url }}
          style={styles.detailImage}
        />
      </View>

      <Text style={styles.detailName}>{product.name}</Text>
      <Text style={styles.detailPrice}>${Number(product.price).toFixed(2)}</Text>
      <Text style={styles.detailDescription}>{product.description}</Text>

      <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
        <Button
          mode="contained"
          onPress={async () => {
            const token = await AsyncStorage.getItem("token");
            if (!token) return Alert.alert("Login required", "Please login first");
            try {
              await axios.post(
                `${API}/cart`,
                { product_id: product._id, quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert("Added", `${product.name} added to cart`);
              cartEvents.emit("cartUpdated");
            } catch {
              Alert.alert("Error", "Could not add to cart");
            }
          }}
          style={[styles.primaryBtn, { flex: 1 }]}
          labelStyle={styles.buttonLabel}
        >
          🛒 Add to Cart
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()}
          style={styles.secondaryBtn}
          labelStyle={{ color: "#1A1A1A" }}
        >
          ← Back
        </Button>
      </View>
    </SafeAreaView>
  );
}

/* ---------- CART ---------- */
function CartScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setItems([]);
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data || []);
    } catch (err) {
      console.error("Cart load err", err);
      Alert.alert("Error", "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchCart(); }, []));

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F0", padding: 16 }}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#1A1A1A" />
        <Appbar.Content title="Your Cart" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartIcon}>🛍️</Text>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <Button mode="contained" onPress={() => navigation.navigate("Home")} style={styles.primaryBtn}>
            Start Shopping
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <Card style={styles.cartItem}>
              <Card.Content style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.cartImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.cartItemPrice}>${item.price}</Text>

                  <View style={{ flexDirection: "row", marginTop: 8, alignItems: 'center' }}>
                    <Button
                      compact
                      mode="outlined"
                      onPress={async () => {
                        try {
                          await axios.put(
                            `${API}/cart/${item.id}`,
                            { action: 'decrement' },
                            {
                              headers: {
                                Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
                              },
                            }
                          );
                          fetchCart();
                        } catch (e) {
                          console.error(e);
                          Alert.alert("Error", "Could not update quantity");
                        }
                      }}
                      style={styles.quantityBtn}
                      labelStyle={styles.quantityBtnLabel}
                    >
                      -
                    </Button>

                    <Text style={styles.quantityText}>
                      {item.quantity}
                    </Text>

                    <Button
                      compact
                      mode="outlined"
                      onPress={async () => {
                        try {
                          await axios.put(
                            `${API}/cart/${item.id}`,
                            { action: 'increment' },
                            {
                              headers: {
                                Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
                              },
                            }
                          );
                          fetchCart();
                        } catch (e) {
                          console.error(e);
                          Alert.alert("Error", "Could not update quantity");
                        }
                      }}
                      style={styles.quantityBtn}
                      labelStyle={styles.quantityBtnLabel}
                    >
                      +
                    </Button>

                    <Button
                      compact
                      style={styles.removeBtn}
                      labelStyle={styles.removeBtnLabel}
                      onPress={async () => {
                        try {
                          await axios.delete(`${API}/cart/${item.id}`, {
                            headers: {
                              Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
                            },
                          });
                          fetchCart();
                        } catch (e) {
                          console.error(e);
                          Alert.alert("Error", "Could not remove item");
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}

      {items.length > 0 && (
        <View style={styles.checkoutSection}>
          <Text style={styles.totalText}>
            Total: ${total.toFixed(2)}
          </Text>
          <Button
            mode="contained"
            style={styles.checkoutBtn}
            labelStyle={styles.buttonLabel}
            onPress={async () => {
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                Alert.alert("Login required", "Please login to checkout");
                return;
              }
              if (items.length === 0) {
                Alert.alert("Cart empty", "Add items first");
                return;
              }
              try {
                const res = await axios.post(
                  `${API}/checkout`,
                  {
                    shipping: {
                      address: "123 Test St",
                      phone: "1234567890",
                    },
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                Alert.alert("Order placed", `Order #${res.data.orderId} total $${res.data.total}`);
                fetchCart();
              } catch (err) {
                console.error("Checkout err", err);
                Alert.alert("Error", "Checkout failed");
              }
            }}
          >
            Checkout →
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ---------- PROFILE ---------- */
function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const navigation = useNavigation<any>();
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    })();
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F0", padding: 20 }}>
      <View style={styles.profileCard}>
        <Text style={styles.profileAvatar}>👤</Text>
        <Text style={styles.profileTitle}>✨ {profile?.name || "Fashion Lover"}</Text>
        <Text style={styles.profileText}>📧 {profile?.email}</Text>
        <Text style={styles.profileText}>⭐ Role: {profile?.role === "seller" ? "Seller" : "Premium Buyer"}</Text>
      </View>
      <Button
        mode="contained"
        style={[styles.logoutBtn]}
        labelStyle={styles.buttonLabel}
        onPress={async () => {
          await AsyncStorage.removeItem("token");
          navigation.replace("Login");
        }}
      >
        Logout
      </Button>
    </SafeAreaView>
  );
}

/* ---------- NAVIGATION ---------- */
import { MaterialCommunityIcons } from "@expo/vector-icons";

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1A1A1A",
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
        },
        tabBarActiveTintColor: "#C9A96E",
        tabBarInactiveTintColor: "#888",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Cart") iconName = "cart-outline";
          else if (route.name === "Profile") iconName = "account-outline";

          return (
            <MaterialCommunityIcons name={iconName} size={22} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "SHOP" }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: "CART" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "PROFILE" }} />
    </Tab.Navigator>
  );
}

/* ---------- APP ROOT ---------- */
export default function App() {
  return (
    <PaperProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Details" component={DetailsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

/* ---------- STYLES (COMPLETELY REDESIGNED) ---------- */
const styles = StyleSheet.create({
  // Container styles
  containerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F5F5F0",
  },
  
  // Typography
  title: { 
    color: "#1A1A1A", 
    fontSize: 34, 
    fontWeight: "800", 
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  logoWrapper: {
    marginBottom: 32,
    alignItems: 'center',
  },
  
  // Inputs
  input: {
    backgroundColor: "#FFFFFF",
    color: "#1A1A1A",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'normal',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    color: "#999",
  },
  searchInput: {
    flex: 1,
    color: "#1A1A1A",
    padding: 12,
    fontSize: 16,
  },
  
  // Buttons
  primaryBtn: { 
    backgroundColor: "#1A1A1A", 
    width: "100%", 
    padding: 6,
    borderRadius: 12,
    elevation: 2,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: "#1A1A1A",
    borderWidth: 1,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  link: { 
    color: "#666", 
    marginTop: 24,
    fontSize: 14,
    textAlign: 'center',
  },
  linkBold: {
    color: "#C9A96E",
    fontWeight: '700',
  },
  
  // Role buttons
  roleBtn: {
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  roleBtnActive: { 
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  roleText: {
    color: "#666",
    fontWeight: '500',
  },
  roleTextActive: {
    color: "#FFFFFF",
    fontWeight: '600',
  },
  
  // Header
  header: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    color: "#1A1A1A",
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: 1,
  },
  
  // Category chips
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chipActive: { 
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  chipText: {
    color: "#666",
    fontWeight: '500',
    fontSize: 14,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: '600',
  },
  
  // Product cards
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  imageContainer: {
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  productImage: { 
    width: "100%", 
    height: 170, 
    borderRadius: 12, 
    resizeMode: "contain" 
  },
  productContent: {
    padding: 12,
    paddingTop: 8,
  },
  pName: { 
    color: "#1A1A1A", 
    fontSize: 14, 
    fontWeight: '600',
    lineHeight: 18,
  },
  price: { 
    color: "#C9A96E", 
    fontWeight: "800", 
    marginTop: 6,
    fontSize: 16,
  },
  
  // Loading
  loading: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#F5F5F0",
  },
  
  // Detail screen
  detailImageContainer: {
    backgroundColor: "#FAFAFA",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  detailImage: {
    width: "100%",
    height: 320,
    borderRadius: 16,
    resizeMode: "contain",
  },
  detailName: {
    color: "#1A1A1A",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 8,
  },
  detailPrice: {
    color: "#C9A96E",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  detailDescription: {
    color: "#666",
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Cart
  cartItem: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cartImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#FAFAFA",
  },
  cartItemName: {
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  cartItemPrice: {
    color: "#C9A96E",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  quantityBtn: {
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 8,
  },
  quantityBtnLabel: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: '600',
  },
  quantityText: {
    color: "#1A1A1A",
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  removeBtn: {
    marginLeft: 12,
  },
  removeBtnLabel: {
    color: "#C9A96E",
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Empty cart
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyCartIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyCartText: {
    color: "#999",
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
  },
  
  // Checkout
  checkoutSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalText: {
    color: "#1A1A1A",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  checkoutBtn: {
    backgroundColor: "#C9A96E",
    padding: 8,
    borderRadius: 12,
  },
  
  // Profile
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  profileAvatar: {
    fontSize: 64,
    marginBottom: 12,
  },
  profileTitle: {
    color: "#1A1A1A",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  profileText: {
    color: "#666",
    fontSize: 16,
    marginBottom: 8,
  },
  logoutBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 6,
  },
});