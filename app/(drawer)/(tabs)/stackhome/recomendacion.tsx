import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "@/supabase";
import { url, ENDPOINTS } from "@/config/api";

interface BusinessData {
  id: string;
  user_id: string;
  businessName: string | null;
  actividad: string | null;
  monthly_income: number | null;
  monthly_expenses: number | null;
  net_profit: number | null;
  profit_margin: number | null;
  cash_flow: number | null;
  debt_ratio: number | null;
  business_age_years: number | null;
  employees: number | null;
  digitalization_score: number | null;
  metodos_pago: string | null;
  has_rfc: boolean;
  has_efirma: boolean;
  emite_cfdi: boolean;
  declara_mensual: boolean;
  access_to_credit: boolean;
  formal: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileData {
  actividad: string;
  ingresos_anuales: number;
  empleados: number;
  metodos_pago: string[];
  estado: string;
  has_rfc: boolean;
  has_efirma: boolean;
  emite_cfdi: boolean;
  declara_mensual: boolean;
}

interface RiskData {
  score: number;
  level: string;
  message: string;
  details: {
    has_rfc: boolean;
    has_efirma: boolean;
    emite_cfdi: boolean;
    declara_mensual: boolean;
  };
}

interface SourceData {
  title: string;
  scope: string;
  url: string;
  similarity: number;
}

interface ApiResponse {
  success: boolean;
  profile: ProfileData;
  risk: RiskData;
  recommendation: string;
  sources: SourceData[];
  matches_count: number;
  timestamp: string;
}

export default function InformalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { markDone, setActive } = useProgress();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    loadRecommendation();
  }, [user?.id]);

  const generateDataHash = (businessData: BusinessData): string => {
    const relevantData = {
      actividad: businessData.actividad,
      monthly_income: businessData.monthly_income,
      employees: businessData.employees,
      has_rfc: businessData.has_rfc,
      has_efirma: businessData.has_efirma,
      emite_cfdi: businessData.emite_cfdi,
      declara_mensual: businessData.declara_mensual,
    };
    return JSON.stringify(relevantData);
  };

  const loadRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError("Usuario no autenticado");
        Alert.alert("Error", "Debes iniciar sesión para ver recomendaciones");
        return;
      }

      const cachedData = await AsyncStorage.getItem(`recommendation_${user.id}`);
      const cachedHash = await AsyncStorage.getItem(`recommendation_hash_${user.id}`);

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (businessError || !businessData) {
        console.error('❌ Error obteniendo datos del negocio:', businessError);
        setError("No se encontraron datos del negocio");
        Alert.alert(
          "Sin Datos",
          "Primero debes completar el cuestionario de tu negocio",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ir al Cuestionario", onPress: () => router.push('/cuestionario') }
          ]
        );
        return;
      }

      const currentHash = generateDataHash(businessData);
      
      if (cachedData && cachedHash === currentHash) {
        console.log(' Cargando recomendación');
        const parsedData = JSON.parse(cachedData);
        setData(parsedData);
        setIsFromCache(true);
        setLoading(false);
      } else {
        console.log(' Datos actualizados, obteniendo nueva recomendación');
        setIsFromCache(false);
        await fetchRecommendation(businessData, currentHash);
      }
    } catch (err) {
      console.error(" Error cargando recomendacion:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Forzar actualización manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchRecommendation();
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchRecommendation = async (existingBusinessData?: BusinessData, existingHash?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError("Usuario no autenticado");
        Alert.alert("Error", "Debes iniciar sesión para ver recomendaciones");
        return;
      }

      // Usar datos existentes o obtener nuevos
      let businessData: BusinessData | null = existingBusinessData || null;
      let currentHash = existingHash;

      if (!businessData) {
        const { data: fetchedData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (businessError || !fetchedData) {
          console.error(' Error obteniendo datos del negocio:', businessError);
          setError("No se encontraron datos del negocio");
          Alert.alert(
            "Sin Datos",
            "Primero debes completar el cuestionario de tu negocio",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Ir al Cuestionario", onPress: () => router.push('/cuestionario') }
            ]
          );
          return;
        }

        businessData = fetchedData;
        currentHash = generateDataHash(fetchedData);
      }

      if (!businessData) {
        setError("No se encontraron datos del negocio");
        return;
      }


      let metodosPagoArray: string[] = [];
      if (businessData.metodos_pago) {
        try {
          metodosPagoArray = typeof businessData.metodos_pago === 'string' 
            ? JSON.parse(businessData.metodos_pago) 
            : businessData.metodos_pago;
        } catch (e) {
          console.warn('⚠️ Error parseando metodos_pago, usando array vacío');
          metodosPagoArray = [];
        }
      }

      const ingresosAnuales = (businessData.monthly_income || 0) * 12;

      const profileData = {
        profile: {
          actividad: businessData.actividad || "Sin especificar",
          ingresos_anuales: ingresosAnuales,
          empleados: businessData.employees || 0,
          metodos_pago: metodosPagoArray,
          estado: user.location || "Sin especificar",
          has_rfc: businessData.has_rfc || false,
          has_efirma: businessData.has_efirma || false,
          emite_cfdi: businessData.emite_cfdi || false,
          declara_mensual: businessData.declara_mensual || false,
        },
      };

      console.log('🚀 Enviando petición con datos reales:', profileData);
      console.log('🔗 URL del endpoint:', url(ENDPOINTS.recommendation));

      const response = await fetch(url(ENDPOINTS.recommendation), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);


      if (!response.ok) {
        throw new Error("Error al obtener la recomendación");
      }

      const result = await response.json();
      console.log('📦 Response data keys:', Object.keys(result));
      console.log('📦 Full response:', JSON.stringify(result, null, 2));

      let recommendationText = result.recommendation;
      let sources = result.sources || [];
      let matchesCount = result.matches_count || 0;

      if (typeof recommendationText === 'string' && recommendationText.startsWith('{')) {
        try {
          const parsedRecommendation = JSON.parse(recommendationText);
          
          if (parsedRecommendation.success && parsedRecommendation.data) {
            recommendationText = parsedRecommendation.data.recommendation || recommendationText;
            sources = parsedRecommendation.data.sources || sources;
            matchesCount = parsedRecommendation.data.matches_count || matchesCount;
          } else if (parsedRecommendation.recommendation) {
            recommendationText = parsedRecommendation.recommendation;
          }
        } catch (e) {
          console.warn('⚠️ No se pudo parsear recommendation, usando como está');
        }
      }

      const transformedData: ApiResponse = {
        success: result.success ?? false,
        profile: result.profile ?? {
          actividad: "Sin especificar",
          ingresos_anuales: 0,
          empleados: 0,
          metodos_pago: [],
          estado: "Sin especificar",
          has_rfc: false,
          has_efirma: false,
          emite_cfdi: false,
          declara_mensual: false,
        },
        risk: result.risk ?? {
          score: 0,
          level: "Desconocido",
          message: "No se pudo determinar el nivel de riesgo",
          details: {
            has_rfc: false,
            has_efirma: false,
            emite_cfdi: false,
            declara_mensual: false,
          }
        },
        recommendation: recommendationText || "No se generó ninguna recomendación.",
        sources: sources || [],
        matches_count: matchesCount || 0,
        timestamp: result.timestamp || new Date().toISOString(),
      };

      setData(transformedData);
      console.log('✅ Recomendación procesada y estado actualizado');
      console.log(transformedData);

      try {
        await AsyncStorage.setItem(`recommendation_${user.id}`, JSON.stringify(transformedData));
        if (currentHash) {
          await AsyncStorage.setItem(`recommendation_hash_${user.id}`, currentHash);
        }
        setIsFromCache(false);
      } catch (cacheError) {
        console.warn('⚠️ Error guardando en cache:', cacheError);
      }

      
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      Alert.alert("Error", "No se pudo obtener la recomendación fiscal");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "verde":
        return "#4CAF50";
      case "amarillo":
        return "#FFD700";
      case "rojo":
        return "#FF0000";
      default:
        return "#999999";
    }
  };

  const openUrl = async (url: string) => {
    try {
      const cleanUrl = url.trim().replace(/[\[\]]/g, "");
      const canOpen = await Linking.canOpenURL(cleanUrl);
      if (canOpen) {
        await Linking.openURL(cleanUrl);
      } else {
        Alert.alert("Error", "No se puede abrir este enlace");
      }
    } catch (error) {
      console.error("Error abriendo URL:", error);
      Alert.alert("Error", "No se pudo abrir el enlace");
    }
  };

  const extractRegimen = (text: string): string | null => {
    // Verificar que el texto no esté vacío
    if (!text || text.trim().length === 0) {
      return null;
    }

    // Formato 1: "* **Régimen:** Régimen de Actividades Profesionales (honorarios)."
    let regimenMatch = text.match(/\*\s*\*\*Régimen:\*\*\s*([^.\n]+)/i);
    if (regimenMatch) {
      return regimenMatch[1].trim();
    }

    // Formato 2: "**Régimen de Actividades Profesionales (Honorarios):**"
    regimenMatch = text.match(/\*\*\s*([^*:]+\([^)]+\))\s*:\*\*/i);
    if (regimenMatch) {
      return regimenMatch[1].trim();
    }
    
    // Formato 3: "el régimen fiscal más adecuado...: **régimen**"
    regimenMatch = text.match(/el régimen fiscal más [^:]*:\s*\*\*([^*]+)\*\*/i);
    if (regimenMatch) {
      return regimenMatch[1].trim();
    }
    
    // Formato 4: Buscar en la primera sección después de "1)"
    regimenMatch = text.match(/\*\*1\)[^:]*:\*\*\s*\n\s*\*\s*\*\*([^*:]+):/i);
    if (regimenMatch) {
      return regimenMatch[1].trim();
    }

    // Formato 5: Buscar "Régimen:" seguido de texto hasta punto o salto de línea
    regimenMatch = text.match(/Régimen:\s*([^.\n]+)/i);
    if (regimenMatch) {
      return regimenMatch[1].trim();
    }
    
    return null;
  };

  const parseRecommendationSections = (text: string) => {
    const sections: { title: string; content: string; icon: string }[] = [];
    
    // Verificar si el texto está vacío o es muy corto
    if (!text || text.trim().length === 0) {
      return [{
        title: 'Sin recomendaciones',
        content: 'No se pudieron generar recomendaciones en este momento. Por favor, intenta nuevamente.',
        icon: 'alert-circle-outline'
      }];
    }
    
    // Buscar secciones numeradas con punto: **1. Título:** o **2. Título:**
    const sectionRegexDot = /\*\*(\d+)\.\s*([^:*]+):\*\*/g;
    let matches = [...text.matchAll(sectionRegexDot)];
    
    // Si no encuentra con punto, buscar con paréntesis: **1) Título:**
    if (matches.length === 0) {
      const sectionRegexParen = /\*\*(\d+)\)\s*([^:*]+):\*\*/g;
      matches = [...text.matchAll(sectionRegexParen)];
    }
    
    if (matches.length > 0) {
      matches.forEach((match, index) => {
        const sectionNumber = match[1];
        const sectionTitle = match[2].trim();
        const startIndex = match.index! + match[0].length;
        const endIndex = index < matches.length - 1 
          ? matches[index + 1].index! 
          : text.length;
        
        let sectionContent = text.substring(startIndex, endIndex).trim();
        
        // Limpiar el contenido: remover la primera línea si está vacía y saltos de línea extra al final
        sectionContent = sectionContent.replace(/^\n+/, '').replace(/\n+$/, '');
        
        // Solo agregar secciones con contenido
        if (sectionContent) {
          sections.push({
            title: sectionTitle,
            content: sectionContent,
            icon: getIconForSection(sectionTitle),
          });
        }
      });
    }
    
    // Si no hay secciones numeradas, usar el texto completo
    if (sections.length === 0) {
      sections.push({ 
        title: 'Recomendación General', 
        content: text, 
        icon: 'lightbulb' 
      });
    }
    
    return sections;
  };

  const getIconForSection = (title: string): string => {
    const titleLower = title.toLowerCase();
    
    // Específicos del nuevo formato
    if (titleLower.includes('régimen fiscal') || titleLower.includes('régimen más conveniente')) return 'bank';
    if (titleLower.includes('pasos') && titleLower.includes('formalización')) return 'clipboard-list-outline';
    if (titleLower.includes('fuentes oficiales') || titleLower.includes('fuentes del sat')) return 'book-open-variant';
    
    // Generales
    if (titleLower.includes('régimen')) return 'bank';
    if (titleLower.includes('obligacion') || titleLower.includes('cumplimiento')) return 'clipboard-check';
    if (titleLower.includes('beneficio') || titleLower.includes('ventaja')) return 'star';
    if (titleLower.includes('paso') || titleLower.includes('acción')) return 'foot-print';
    if (titleLower.includes('documentos') || titleLower.includes('requisitos')) return 'file-document';
    if (titleLower.includes('plazo') || titleLower.includes('fecha')) return 'calendar-clock';
    
    return 'information';
  };

  const renderFormattedText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // Dividir el texto por líneas
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (line.trim() === '') {
        parts.push(<View key={`space-${key++}`} style={{ height: 8 }} />);
        return;
      }

      // Detectar si es un bullet point (*)
      const isBullet = line.trim().startsWith('*');
      const cleanLine = isBullet ? line.trim().substring(1).trim() : line;

      // Procesar cada línea para encontrar texto en negrita y cursiva
      const segments: React.ReactNode[] = [];
      let currentText = cleanLine;
      let segmentKey = 0;

      // Agregar bullet si es necesario
      if (isBullet) {
        segments.push(
          <Text key={`bullet-${segmentKey++}`} style={styles.recommendationText}>
            • {' '}
          </Text>
        );
      }

      while (currentText.length > 0) {
        // Buscar texto en negrita (**texto**)
        const boldMatch = currentText.match(/^(.*?)\*\*([^*]+)\*\*/);
        if (boldMatch) {
          if (boldMatch[1]) {
            segments.push(
              <Text key={`seg-${segmentKey++}`} style={styles.recommendationText}>
                {boldMatch[1]}
              </Text>
            );
          }
          segments.push(
            <Text key={`seg-${segmentKey++}`} style={[styles.recommendationText, styles.boldText]}>
              {boldMatch[2]}
            </Text>
          );
          currentText = currentText.substring(boldMatch[0].length);
          continue;
        }

        // Buscar texto en cursiva (*texto*)
        const italicMatch = currentText.match(/^(.*?)\*([^*]+)\*/);
        if (italicMatch) {
          if (italicMatch[1]) {
            segments.push(
              <Text key={`seg-${segmentKey++}`} style={styles.recommendationText}>
                {italicMatch[1]}
              </Text>
            );
          }
          segments.push(
            <Text key={`seg-${segmentKey++}`} style={[styles.recommendationText, styles.italicText]}>
              {italicMatch[2]}
            </Text>
          );
          currentText = currentText.substring(italicMatch[0].length);
          continue;
        }

        // Si no hay más formato, agregar el resto del texto
        segments.push(
          <Text key={`seg-${segmentKey++}`} style={styles.recommendationText}>
            {currentText}
          </Text>
        );
        break;
      }

      parts.push(
        <View key={`line-${key++}`} style={isBullet ? styles.bulletLine : { marginBottom: 4 }}>
          <Text>{segments}</Text>
        </View>
      );
    });

    return <View>{parts}</View>;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Analizando tu perfil fiscal...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recomendación Fiscal</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#FF0000" />
          <Text style={styles.errorText}>{error || "Error al cargar datos"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadRecommendation()}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recomendación Fiscal</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
          <MaterialCommunityIcons 
            name="refresh" 
            size={24} 
            color={isRefreshing ? "#CCCCCC" : "#000000"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#000000"
            colors={["#000000"]}
          />
        }
      >
        
        {/* Warning for insufficient data */}
        {data.recommendation && data.recommendation.toLowerCase().includes('información insuficiente') && (
          <View style={styles.warningCard}>
            <MaterialCommunityIcons name="alert" size={32} color="#FF9800" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Información Limitada</Text>
              <Text style={styles.warningText}>
                La base de conocimientos no tiene suficiente información para tu perfil específico. 
                Las recomendaciones pueden ser generales.
              </Text>
            </View>
          </View>
        )}

        {/* Régimen Fiscal Destacado - PRIMERO */}
        {extractRegimen(data.recommendation) && (
          <View style={styles.regimenHeroCard}>
            <View style={styles.regimenHeroIcon}>
              <MaterialCommunityIcons name="trophy" size={40} color="#FFD700" />
            </View>
            <Text style={styles.regimenHeroLabel}>Tu Régimen Fiscal Ideal</Text>
            <Text style={styles.regimenHeroValue}>{extractRegimen(data.recommendation)}</Text>
            <View style={styles.regimenHeroBadge}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
              <Text style={styles.regimenHeroBadgeText}>Recomendación Personalizada</Text>
            </View>
          </View>
        )}

        {/* Recomendaciones Interactivas - SEGUNDO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clipboard-list" size={24} color="#000000" />
            <Text style={styles.cardTitle}>Guía de Formalización</Text>
          </View>
          
          {parseRecommendationSections(data.recommendation).map((section, index) => (
            <View key={index} style={styles.recommendationSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <MaterialCommunityIcons name={section.icon as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.sectionContent}>
                {renderFormattedText(section.content)}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.riskHeader}>
            <MaterialCommunityIcons name="shield-check" size={32} color={getRiskColor(data.risk?.level || 'Desconocido')} />
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>Nivel de Riesgo</Text>
              <View style={styles.riskBadge}>
                <View style={[styles.riskDot, { backgroundColor: getRiskColor(data.risk?.level || 'Desconocido') }]} />
                <Text style={[styles.riskLevel, { color: getRiskColor(data.risk?.level || 'Desconocido') }]}>
                  {data.risk?.level || 'Desconocido'}
                </Text>
              </View>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreNumber}>{data.risk?.score || 0}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>
          <Text style={styles.riskMessage}>{data.risk?.message || 'No hay información de riesgo disponible'}</Text>

          {/* Risk Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Estado de Cumplimiento:</Text>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={data.risk?.details?.has_rfc ? "check-circle" : "close-circle"}
                size={20}
                color={data.risk?.details?.has_rfc ? "#4CAF50" : "#FF0000"}
              />
              <Text style={styles.detailText}>RFC Registrado</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={data.risk?.details?.has_efirma ? "check-circle" : "close-circle"}
                size={20}
                color={data.risk?.details?.has_efirma ? "#4CAF50" : "#FF0000"}
              />
              <Text style={styles.detailText}>e.firma Vigente</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={data.risk?.details?.emite_cfdi ? "check-circle" : "close-circle"}
                size={20}
                color={data.risk?.details?.emite_cfdi ? "#4CAF50" : "#FF0000"}
              />
              <Text style={styles.detailText}>Emite CFDI</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={data.risk?.details?.declara_mensual ? "check-circle" : "close-circle"}
                size={20}
                color={data.risk?.details?.declara_mensual ? "#4CAF50" : "#FF0000"}
              />
              <Text style={styles.detailText}>Declaración Mensual</Text>
            </View>
          </View>
        </View>

        {/* Fuentes Consultadas */}
        {data.sources && data.sources.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="book-open-variant" size={24} color="#000000" />
              <Text style={styles.cardTitle}>Fuentes Consultadas ({data.matches_count || data.sources.length})</Text>
            </View>
            {data.sources.map((source, index) => {
              const isValidUrl = source?.url && 
                                source.url !== "Libro" && 
                                !source.url.startsWith("file:///") && 
                                (source.url.startsWith("http://") || source.url.startsWith("https://"));
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.sourceItem}
                  onPress={() => isValidUrl && openUrl(source.url)}
                  disabled={!isValidUrl}
                >
                  <View style={styles.sourceIcon}>
                    <MaterialCommunityIcons
                      name={isValidUrl ? "web" : "book"}
                      size={20}
                      color="#000000"
                    />
                  </View>
                  <View style={styles.sourceContent}>
                    <Text style={styles.sourceTitle} numberOfLines={2}>
                      {source?.title || 'Sin título'}
                    </Text>
                    <Text style={styles.sourceScope}>{source?.scope || 'General'}</Text>
                    <View style={styles.sourceFooter}>
                      <View style={styles.similarityBadge}>
                        <Text style={styles.similarityText}>
                          {((source?.similarity || 0) * 100).toFixed(0)}% relevancia
                        </Text>
                      </View>
                      {isValidUrl && (
                        <MaterialIcons name="open-in-new" size={16} color="#999999" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Cache indicator */}
        {isFromCache && (
          <View style={styles.cacheIndicator}>
            <MaterialCommunityIcons name="database-clock" size={16} color="#2196F3" />
            <Text style={styles.cacheText}>Presiona refrescar para actualizar</Text>
          </View>
        )}

        {/* Timestamp */}
        <View style={styles.timestampContainer}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#999999" />
          <Text style={styles.timestampText}>
            Actualizado: {new Date(data.timestamp).toLocaleString("es-MX")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#000000",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginLeft: 8,
  },
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  riskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riskTitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#666666",
  },
  riskMessage: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 16,
    fontWeight: "500",
  },
  detailsContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
  profileGrid: {
    gap: 12,
  },
  profileItem: {
    marginBottom: 8,
  },
  profileItemFull: {
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  recommendationText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "bold",
    color: "#000000",
  },
  italicText: {
    fontStyle: "italic",
    color: "#666666",
  },
  bulletLine: {
    marginBottom: 6,
    paddingLeft: 4,
  },
  regimenContainer: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  regimenLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  regimenValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  sourceItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    marginBottom: 8,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sourceContent: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  sourceScope: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  sourceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  similarityBadge: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  similarityText: {
    fontSize: 11,
    color: "#666666",
    fontWeight: "500",
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  timestampText: {
    fontSize: 12,
    color: "#999999",
    marginLeft: 6,
  },
  // Nuevos estilos para el régimen hero
  regimenHeroCard: {
    backgroundColor: "#000000",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  regimenHeroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  regimenHeroLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    opacity: 0.9,
  },
  regimenHeroValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  regimenHeroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  regimenHeroBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 6,
    fontWeight: "600",
  },
  // Estilos para secciones de recomendación
  recommendationSection: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#F9F9F9",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  sectionContent: {
    padding: 16,
  },
  // Estilo para card colapsable
  collapsibleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Estilos para warning card
  warningCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 6,
  },
  warningText: {
    fontSize: 14,
    color: "#E65100",
    lineHeight: 20,
  },
  // Estilos para cache indicator
  cacheIndicator: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  cacheText: {
    fontSize: 13,
    color: "#1976D2",
    marginLeft: 8,
    flex: 1,
  },
});
