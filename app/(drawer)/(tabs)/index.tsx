import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a stackhome
    router.replace('/(drawer)/(tabs)/stackhome' as any);
  }, []);

  // No renderizar nada, solo redirigir
  return null;
}
