// app/bankmap.tsx - Mapa de Bancos y SAT sin autenticación
"use client"
import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import * as Location from "expo-location"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import MapView, { Callout, Marker, Region } from "react-native-maps"

interface Place {
  placeId: string
  name: string
  address: string
  rating?: number
  userRatingsTotal?: number
  isOpen?: boolean
  openingHours?: string[]
  image?: string
  latitude: number
  longitude: number
  types: string[]
  vicinity: string
}

interface MapViewRef {
  animateToRegion: (region: Region, duration: number) => void
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""

export default function BankMap() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [initialRegion, setInitialRegion] = useState<Region>({
    latitude: 32.6277,
    longitude: -115.4523,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
  const [modalVisible, setModalVisible] = useState(true)
  const translateY = useRef(new Animated.Value(0)).current
  const [showOnlyOpen, setShowOnlyOpen] = useState(false)
  const [searchType, setSearchType] = useState<"bank" | "sat">("bank")

  const mapRef = useRef<MapViewRef>(null)
  const markerRefs = useRef<{ [placeId: string]: any }>({})
  const router = useRouter()
  const params = useLocalSearchParams()
  const defColor = "#000000"
  const placeIdParam = (params.placeIdParam as string) || "i"

  const handleModalToggle = () => {
    setModalVisible(!modalVisible)
    Animated.timing(translateY, {
      toValue: modalVisible ? 190 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          setErrorMsg("Se requiere permiso para acceder a la ubicación")
          return
        }
        const location = await Location.getCurrentPositionAsync({})
        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
        setUserLocation(userLoc)
        setInitialRegion({
          latitude: userLoc.latitude,
          longitude: userLoc.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        })
      } catch (error) {
        console.error("Error obteniendo ubicación:", error)
        setErrorMsg("No se pudo obtener la ubicación")
      }
    })()
  }, [])

  const fetchPlaces = async () => {
    if (!userLocation) return

    try {
      setLoading(true)
      const keyword = searchType === "bank" ? "Banorte" : "centro tributario SAT"
      // Usar Text Search en lugar de Nearby Search para mejores resultados
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&location=${userLocation.latitude},${userLocation.longitude}&radius=5000&key=${GOOGLE_MAPS_API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === "OK" && data.results) {
        const placesData: Place[] = data.results.map((place: any) => {
          const photoReference = place.photos?.[0]?.photo_reference
          const imageUrl = photoReference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`
            : undefined

          return {
            placeId: place.place_id,
            name: place.name,
            address: place.vicinity || "",
            rating: place.rating || 0,
            userRatingsTotal: place.user_ratings_total || 0,
            isOpen: place.opening_hours?.open_now ?? undefined,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            types: place.types || [],
            vicinity: place.vicinity || "",
            image: imageUrl,
          }
        })

        setPlaces(shuffleArray(placesData))

        if (placeIdParam && placeIdParam !== "i") {
          const selectedP = placesData.find((p) => p.placeId === placeIdParam)
          if (selectedP) {
            setSelectedPlace(selectedP)
            setTimeout(() => {
              mapRef.current?.animateToRegion(
                {
                  latitude: selectedP.latitude,
                  longitude: selectedP.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                1000,
              )
            }, 500)
          }
        }
      } else {
        console.error("Error en la respuesta de Google Places:", data.status)
        setErrorMsg("No se pudieron cargar los lugares")
      }
    } catch (error) {
      console.error("Error obteniendo lugares:", error)
      setErrorMsg("Error al cargar los datos de los lugares")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLocation) {
      fetchPlaces()
    }
  }, [userLocation, searchType])

  const handleMarkerPress = (place: Place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedPlace(place)
  }

  const centerMapOnPlace = (place: Place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    )
  }

  const centerMapOnUser = () => {
    if (userLocation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      )
    }
  }

  const openInGoogleMaps = (place: Place) => {
    console.log('🗺️ openInGoogleMaps llamado para:', place.name)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    // Crear query con el nombre y dirección del lugar para mejor identificación
    const placeQuery = encodeURIComponent(`${place.name}, ${place.vicinity}`)
    
    const url = Platform.select({
      // iOS: Abrir Apple Maps con el query del lugar
      ios: `maps://?q=${placeQuery}&saddr=Current%20Location`,
      // Android: Abrir Google Maps con el query del lugar para navegar
      android: `https://www.google.com/maps/search/?api=1&query=${placeQuery}&query_place_id=${place.placeId}`,
      // Web: Abrir Google Maps web con el query del lugar
      default: `https://www.google.com/maps/search/?api=1&query=${placeQuery}&query_place_id=${place.placeId}`,
    })
    
    console.log('📱 Platform:', Platform.OS)
    console.log('🔗 URL generada:', url)
    
    Linking.canOpenURL(url)
      .then((supported) => {
        console.log('✅ URL soportada:', supported)
        if (supported) {
          return Linking.openURL(url)
        } else {
          console.log('⚠️ URL no soportada, usando fallback')
          // Fallback: usar las coordenadas si el query no funciona
          const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
          return Linking.openURL(fallbackUrl)
        }
      })
      .then(() => {
        console.log('✅ URL abierta exitosamente')
      })
      .catch((error) => {
        console.error('❌ Error al abrir URL:', error)
        // Último intento con coordenadas simples
        const emergencyUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
        console.log('🆘 Intentando con URL de emergencia:', emergencyUrl)
        Linking.openURL(emergencyUrl).catch((e) => console.error('❌ Error final:', e))
      })
  }

  const filteredPlaces = showOnlyOpen ? places.filter((p) => p.isOpen) : places

  const hasOpenPlaces = places.some((p) => p.isOpen)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={defColor} />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    )
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-circle" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchPlaces()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef as any}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={true}
        showsIndoors={true}
      >
        {filteredPlaces.map((place) => (
          <Marker
            ref={(ref) => {
              if (ref) {
                markerRefs.current[place.placeId] = ref
              }
            }}
            key={place.placeId}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() => {
              handleMarkerPress(place)
              if (Platform.OS === "android") {
                setSelectedPlace(place)
                if (!modalVisible) {
                  setModalVisible(true)
                  Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start()
                }
              }
            }}
            onCalloutPress={() => {
              console.log('📍 Callout presionado en iOS para:', place.name)
              if (Platform.OS === "ios") {
                openInGoogleMaps(place)
              }
            }}
          >
            {Platform.OS === "ios" ? (
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerImageContainer,
                    selectedPlace?.placeId === place.placeId && styles.selectedMarker,
                  ]}
                >
                  {place.image ? (
                    <Image source={{ uri: place.image }} style={styles.markerImage} resizeMode="cover" />
                  ) : (
                    <FontAwesome5 name={searchType === "bank" ? "university" : "landmark"} size={20} color="#FFF" />
                  )}
                </View>
                {place.isOpen !== undefined && (
                  <View style={[styles.statusDot, { backgroundColor: place.isOpen ? "#4CAF50" : "#F44336" }]} />
                )}
              </View>
            ) : (
              <View style={styles.markerContainerAndroid}>
                <View
                  style={[
                    styles.markerImageContainerAndroid,
                    selectedPlace?.placeId === place.placeId && styles.selectedMarkerAndroid,
                  ]}
                >
                  {place.image ? (
                    <Image source={{ uri: place.image }} style={styles.markerImageAndroid} resizeMode="cover" />
                  ) : (
                    <FontAwesome5 name={searchType === "bank" ? "university" : "landmark"} size={20} color="#FFF" />
                  )}
                </View>
              </View>
            )}

            {Platform.OS === "ios" && (
              <Callout>
                <View style={styles.calloutContainer}>
                  <View style={styles.calloutHeader}>
                    {place.image && <Image source={{ uri: place.image }} style={styles.calloutImage} />}
                    <View style={styles.calloutHeaderText}>
                      <Text style={styles.calloutTitle}>{place.name}</Text>
                      <Text style={styles.calloutSpecialty}>{place.vicinity}</Text>
                    </View>
                  </View>

                  <View style={styles.calloutBody}>
                    <Text style={styles.calloutDescription} numberOfLines={2}>
                      {place.address || "Sin dirección disponible"}
                    </Text>

                    {place.rating && (
                      <View style={styles.calloutRating}>
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <MaterialCommunityIcons
                              key={i}
                              name="star"
                              size={12}
                              color={i < Math.floor(place.rating || 0) ? "#000000" : "#E0E0E0"}
                              style={{ marginRight: 2 }}
                            />
                          ))}
                        <Text style={styles.calloutRatingText}>
                          {place.rating.toFixed(1)} ({place.userRatingsTotal})
                        </Text>
                      </View>
                    )}

                    {place.isOpen !== undefined && (
                      <View style={styles.calloutStatus}>
                        <View
                          style={[styles.statusIndicator, { backgroundColor: place.isOpen ? "#4CAF50" : "#F44336" }]}
                        />
                        <Text style={styles.calloutStatusText}>{place.isOpen ? "Abierto ahora" : "Cerrado"}</Text>
                      </View>
                    )}

                    <View style={styles.calloutDirectionsButton}>
                      <MaterialIcons name="directions" size={16} color="#FFF" />
                      <Text style={styles.calloutDirectionsText}>Toca aquí para ver en Google Maps</Text>
                    </View>
                  </View>
                </View>
              </Callout>
            )}
          </Marker>
        ))}
      </MapView>

      {Platform.OS === "android" && selectedPlace && (
        <View style={styles.androidPlaceInfoContainer}>
          <TouchableOpacity style={styles.androidPlaceInfoCard}>
            <View style={styles.androidPlaceInfoHeader}>
              {selectedPlace.image && (
                <Image source={{ uri: selectedPlace.image }} style={styles.androidPlaceInfoImage} />
              )}
              <View style={styles.androidPlaceInfoHeaderText}>
                <Text style={styles.androidPlaceInfoTitle}>{selectedPlace.name}</Text>
                <Text style={styles.androidPlaceInfoSpecialty}>{selectedPlace.vicinity}</Text>

                {selectedPlace.rating && (
                  <View style={styles.androidPlaceInfoRating}>
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <MaterialCommunityIcons
                          key={i}
                          name="star"
                          size={14}
                          color={i < Math.floor(selectedPlace.rating || 0) ? "#000000" : "#E0E0E0"}
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    <Text style={styles.androidPlaceInfoRatingText}>{selectedPlace.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.androidPlaceInfoCloseButton} onPress={() => setSelectedPlace(null)}>
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.androidPlaceInfoBody}>
              <Text style={styles.androidPlaceInfoDescription} numberOfLines={2}>
                {selectedPlace.address || "Sin dirección disponible"}
              </Text>

              {selectedPlace.isOpen !== undefined && (
                <View style={styles.androidPlaceInfoStatus}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: selectedPlace.isOpen ? "#4CAF50" : "#F44336" },
                    ]}
                  />
                  <Text style={styles.androidPlaceInfoStatusText}>
                    {selectedPlace.isOpen ? "Abierto ahora" : "Cerrado"}
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.androidDirectionsButton}
                onPress={() => openInGoogleMaps(selectedPlace)}
              >
                <MaterialIcons name="directions" size={18} color="#FFF" />
                <Text style={styles.androidDirectionsText}>Ver en Google Maps</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mapControls}>
        {userLocation && (
          <TouchableOpacity style={styles.controlButton} onPress={centerMapOnUser}>
            <MaterialIcons name="my-location" size={24} color="#000000" />
          </TouchableOpacity>
        )}

        {selectedPlace && (
          <TouchableOpacity style={styles.controlButton} onPress={() => centerMapOnPlace(selectedPlace)}>
            <FontAwesome5 name="map-marker-alt" size={24} color="#000000" />
          </TouchableOpacity>
        )}

        {hasOpenPlaces && (
          <TouchableOpacity
            style={[styles.controlButton, showOnlyOpen && styles.activeControlButton]}
            onPress={() => setShowOnlyOpen(!showOnlyOpen)}
          >
            <MaterialCommunityIcons name="clock-outline" size={24} color={showOnlyOpen ? "#FFF" : "#000000"} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.controlButton} onPress={() => fetchPlaces()}>
          <MaterialCommunityIcons name="refresh" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchTypeButtons}>
        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === "bank" && styles.activeSearchTypeButton]}
          onPress={() => setSearchType("bank")}
        >
          <FontAwesome5 name="university" size={20} color={searchType === "bank" ? "#FFF" : "#000000"} />
          <Text style={[styles.searchTypeButtonText, searchType === "bank" && styles.activeSearchTypeButtonText]}>
            Bancos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === "sat" && styles.activeSearchTypeButton]}
          onPress={() => setSearchType("sat")}
        >
          <FontAwesome5 name="landmark" size={20} color={searchType === "sat" ? "#FFF" : "#000000"} />
          <Text style={[styles.searchTypeButtonText, searchType === "sat" && styles.activeSearchTypeButtonText]}>
            SAT
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.bottomPanel, { transform: [{ translateY }] }]}>
        <View style={styles.bottomPanelHeader}>
          <Text style={styles.bottomPanelTitle}>
            {showOnlyOpen
              ? searchType === "bank"
                ? "Bancos Abiertos"
                : "Oficinas SAT Abiertas"
              : searchType === "bank"
                ? "Todos los Bancos"
                : "Todas las Oficinas SAT"}
          </Text>
          <View style={styles.bottomPanelActions}>
            {hasOpenPlaces && (
              <TouchableOpacity
                style={[styles.filterButton, showOnlyOpen && styles.activeFilterButton]}
                onPress={() => setShowOnlyOpen(!showOnlyOpen)}
              >
                <Text style={[styles.filterButtonText, showOnlyOpen && styles.activeFilterButtonText]}>
                  {showOnlyOpen ? "Mostrar todos" : "Solo abiertos"}
                </Text>
              </TouchableOpacity>
            )}

            {modalVisible ? (
              <TouchableOpacity style={styles.toggleButton} onPress={handleModalToggle}>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#333" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.toggleButton} onPress={handleModalToggle}>
                <MaterialIcons name="keyboard-arrow-up" size={24} color="#333" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {filteredPlaces.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placesList}>
            {filteredPlaces.map((place) => (
              <TouchableOpacity
                key={place.placeId}
                style={[styles.placeCard, selectedPlace?.placeId === place.placeId && styles.selectedPlaceCard]}
                onPress={() => {
                  handleMarkerPress(place)
                  centerMapOnPlace(place)
                  setSelectedPlace(place)
                  if (Platform.OS === "ios") {
                    setTimeout(() => {
                      markerRefs.current[place.placeId]?.showCallout()
                    }, 1100)
                  }
                }}
              >
                {place.image && (
                  <View style={{ overflow: "hidden", height: 80 }}>
                    <Image
                      source={{ uri: place.image }}
                      style={{ width: "100%", height: undefined, aspectRatio: 1 }}
                      resizeMode="cover"
                    />
                  </View>
                )}
                <View style={styles.placeCardContent}>
                  <Text style={styles.placeCardName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <Text style={styles.placeCardAddress} numberOfLines={1}>
                    {place.vicinity}
                  </Text>
                  {place.rating && (
                    <View style={styles.placeCardRating}>
                      <MaterialCommunityIcons name="star" size={16} color="#000000" />
                      <Text style={styles.placeCardRatingText}>{place.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                {place.isOpen !== undefined && !place.isOpen && (
                  <View style={[styles.placeCardStatus, { backgroundColor: "#F44336" }]}>
                    <Text style={styles.placeCardStatusText}>Cerrado</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons name="clock-time-eight-outline" size={50} color="#000000" />
            <Text style={styles.emptyStateTitle}>No hay lugares abiertos</Text>
            <Text style={styles.emptyStateDescription}>En este momento todos los lugares están cerrados.</Text>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

const { width, height } = Dimensions.get("window")

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F4F4",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F4F4",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#000000",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  markerImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  selectedMarker: {
    borderColor: "#999999",
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFF",
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  markerContainerAndroid: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  markerImageContainerAndroid: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  selectedMarkerAndroid: {
    borderColor: "#999999",
    borderWidth: 1.5,
    transform: [{ scale: 1.0 }],
  },
  markerImageAndroid: {
    width: 30,
    height: 30,
    borderRadius: 20,
  },
  calloutContainer: {
    width: width * 0.6,
    padding: 12,
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  calloutImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  calloutHeaderText: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  calloutSpecialty: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  calloutBody: {
    marginBottom: 10,
  },
  calloutDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  calloutRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  calloutRatingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  calloutStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  calloutStatusText: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  mapControls: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "column",
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  activeControlButton: {
    backgroundColor: "#000000",
  },
  searchTypeButtons: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
  },
  searchTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginRight: 8,
  },
  activeSearchTypeButton: {
    backgroundColor: "#000000",
  },
  searchTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 6,
  },
  activeSearchTypeButtonText: {
    color: "#FFF",
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomPanelHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomPanelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  bottomPanelActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: "#000000",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#333",
  },
  activeFilterButtonText: {
    color: "#FFF",
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  placesList: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  placeCard: {
    width: 140,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginHorizontal: 4,
    marginTop: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedPlaceCard: {
    borderColor: "#000000",
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  placeCardContent: {
    padding: 8,
  },
  placeCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  placeCardAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  placeCardRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeCardRatingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  placeCardStatus: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  placeCardStatusText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  androidPlaceInfoContainer: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  androidPlaceInfoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  androidPlaceInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  androidPlaceInfoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  androidPlaceInfoHeaderText: {
    flex: 1,
  },
  androidPlaceInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  androidPlaceInfoSpecialty: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  androidPlaceInfoRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  androidPlaceInfoRatingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  androidPlaceInfoCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  androidPlaceInfoBody: {
    marginBottom: 12,
  },
  androidPlaceInfoDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  androidPlaceInfoStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  androidPlaceInfoStatusText: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
    marginLeft: 6,
  },
  calloutDirectionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  calloutDirectionsText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  androidDirectionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  androidDirectionsText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
})
