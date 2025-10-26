import Roadmap from "@/components/roadmap";
import { useProgress } from "@/context/ProgressContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Animated,
  Dimensions
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
}

interface CalendarReminder {
  id: string;
  title: string;
  frequency: string;
  date: string;
  description: string;
}

// Sistema de Rangos
const RANKS = [
  { name: 'Bronce', min: 0, max: 24, color: '#CD7F32', icon: 'medal-outline' },
  { name: 'Plata', min: 25, max: 49, color: '#C0C0C0', icon: 'medal-outline' },
  { name: 'Oro', min: 50, max: 74, color: '#FFD700', icon: 'medal' },
  { name: 'Zafiro', min: 75, max: 100, color: '#0F52BA', icon: 'trophy' },
];

export default function FullRoadmapScreen() {
  const { state } = useProgress();
  const router = useRouter();

  // Tareas accionables para crecimiento
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Define tu nicho de mercado', completed: false, category: 'Estrategia' },
    { id: '2', title: 'Crea un portafolio online', completed: false, category: 'Marketing' },
    { id: '3', title: 'Networking en eventos de tecnología', completed: false, category: 'Networking' },
    { id: '4', title: 'Marketing digital y redes sociales', completed: false, category: 'Marketing' },
    { id: '5', title: 'Mejora tus habilidades con cursos', completed: false, category: 'Desarrollo' },
    { id: '6', title: 'Automatiza tareas administrativas', completed: false, category: 'Productividad' },
    { id: '7', title: 'Establece precios competitivos', completed: false, category: 'Finanzas' },
    { id: '8', title: 'Pide retroalimentación a clientes', completed: false, category: 'Calidad' },
  ]);

  // Recordatorios de calendario
  const calendarReminders: CalendarReminder[] = [
    { 
      id: '1', 
      title: 'Declaración mensual RESICO', 
      frequency: 'Mensual', 
      date: 'Día 17 del mes siguiente',
      description: 'Declaración de impuestos RESICO'
    },
    { 
      id: '2', 
      title: 'Declaración anual RESICO', 
      frequency: 'Anual', 
      date: 'Abril',
      description: 'Presentar declaración anual'
    },
    { 
      id: '3', 
      title: 'Constancias a trabajadores', 
      frequency: 'Anual', 
      date: 'Febrero',
      description: 'Expedir constancias de percepciones y retenciones'
    },
    { 
      id: '4', 
      title: 'DIM - Declaración Informativa', 
      frequency: 'Anual', 
      date: '15 de Febrero',
      description: 'Presentar Declaración Informativa Múltiple'
    },
  ];

  const steps = [
    { key: 'perfil', title: 'Perfil fiscal', subtitle: 'Cuéntanos de tu empresa', status: state.perfil },
    { key: 'regimen', title: 'Régimen óptimo', subtitle: 'Recomendación', status: state.regimen },
    { key: 'obligaciones', title: 'Obligaciones', subtitle: 'Configura y cumple', status: state.obligaciones },
    { key: 'calendario', title: 'Calendario SAT', subtitle: 'Fechas clave', status: state.calendario },
    { key: 'riesgos', title: 'Riesgo fiscal', subtitle: 'Mitiga y mejora', status: state.riesgos },
  ];

  // Calcular progreso
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercentage = Math.round((completedTasks / tasks.length) * 100);
  
  // Determinar rango actual
  const currentRank = RANKS.find(rank => 
    progressPercentage >= rank.min && progressPercentage <= rank.max
  ) || RANKS[0];

  const nextRank = RANKS[RANKS.findIndex(r => r === currentRank) + 1];

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Estrategia': '#8B5CF6',
      'Marketing': '#EC4899',
      'Networking': '#3B82F6',
      'Desarrollo': '#10B981',
      'Productividad': '#F59E0B',
      'Finanzas': '#14B8A6',
      'Calidad': '#6366F1',
    };
    return colors[category] || '#6B7280';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Sección de Rango */}
        <View style={styles.rankCard}>
          <View style={styles.rankHeader}>
            <View style={styles.rankInfo}>
              <Text style={styles.rankLabel}>Tu Rango Actual</Text>
              <View style={styles.rankBadge}>
                <MaterialCommunityIcons 
                  name={currentRank.icon as any} 
                  size={24} 
                  color={currentRank.color} 
                />
                <Text style={[styles.rankName, { color: currentRank.color }]}>
                  {currentRank.name}
                </Text>
              </View>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
          </View>
          
          {/* Barra de progreso */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%`, backgroundColor: currentRank.color }]} />
          </View>
          
          {nextRank && (
            <Text style={styles.nextRankText}>
              {100 - progressPercentage}% para alcanzar {nextRank.name}
            </Text>
          )}
        </View>

        {/* Timeline de Pasos Principales */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="timeline-clock" size={24} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Progreso de Formalización</Text>
        </View>
        
        <View style={styles.timelineCard}>
          {steps.map((step, index) => (
            <TouchableOpacity
              key={step.key}
              style={styles.timelineItem}
              onPress={() => {
                if (step.key === 'perfil' || step.key === 'regimen') 
                  router.push('/(drawer)/(tabs)/stackhome/recomendacion');
                if (step.key === 'riesgos' || step.key === 'obligaciones') 
                  router.push('/(drawer)/(tabs)/stackhome/beneficios');
              }}
            >
              {/* Línea vertical */}
              {index < steps.length - 1 && (
                <View style={[
                  styles.timelineLine,
                  { backgroundColor: step.status === 'done' ? '#10B981' : '#E5E7EB' }
                ]} />
              )}
              
              {/* Círculo indicador */}
              <View style={[
                styles.timelineCircle,
                { 
                  backgroundColor: 
                    step.status === 'done' ? '#10B981' : 
                    step.status === 'active' ? '#4A90E2' : '#E5E7EB'
                }
              ]}>
                {step.status === 'done' && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
              
              {/* Contenido */}
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineSubtitle}>{step.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Checklist de Tareas */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>Tareas para Crecer</Text>
        </View>
        
        <View style={styles.tasksCard}>
          <Text style={styles.tasksProgress}>
            {completedTasks} de {tasks.length} tareas completadas
          </Text>
          
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                task.completed && styles.checkboxCompleted
              ]}>
                {task.completed && (
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                )}
              </View>
              
              <View style={styles.taskContent}>
                <Text style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleCompleted
                ]}>
                  {task.title}
                </Text>
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: `${getCategoryColor(task.category)}20` }
                ]}>
                  <Text style={[
                    styles.categoryText,
                    { color: getCategoryColor(task.category) }
                  ]}>
                    {task.category}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recordatorios de Calendario */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calendar-alert" size={24} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Recordatorios Fiscales</Text>
        </View>
        
        <View style={styles.remindersCard}>
          {calendarReminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderItem}>
              <View style={[
                styles.reminderIcon,
                { backgroundColor: reminder.frequency === 'Mensual' ? '#3B82F620' : '#F59E0B20' }
              ]}>
                <MaterialCommunityIcons 
                  name={reminder.frequency === 'Mensual' ? 'calendar-month' : 'calendar-star'} 
                  size={24} 
                  color={reminder.frequency === 'Mensual' ? '#3B82F6' : '#F59E0B'}
                />
              </View>
              
              <View style={styles.reminderContent}>
                <View style={styles.reminderHeader}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <View style={styles.frequencyBadge}>
                    <Text style={styles.frequencyText}>{reminder.frequency}</Text>
                  </View>
                </View>
                <Text style={styles.reminderDate}>{reminder.date}</Text>
                <Text style={styles.reminderDescription}>{reminder.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  content: { 
    padding: 20,
    paddingBottom: 40,
  },
  
  // Rank Card
  rankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankInfo: {
    flex: 1,
  },
  rankLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  nextRankText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },

  // Timeline
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 40,
    bottom: -12,
    width: 2,
  },
  timelineCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timelineSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Tasks
  tasksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tasksProgress: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  taskTitleCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Reminders
  remindersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reminderItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  frequencyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  frequencyText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  reminderDate: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Spacing
  bottomSpacer: {
    height: 20,
  },

  // Legacy (mantener compatibilidad)
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 12 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    elevation: 3 
  },
});
