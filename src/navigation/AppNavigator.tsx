import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CrearRutinaScreen } from '../screens/CrearRutinaScreen';
import { EditarRutinaScreen } from '../screens/EditarRutinaScreen';
import { BibliotecaScreen } from '../screens/BibliotecaScreen';
import { DetalleRutinaScreen } from '../screens/DetalleRutinaScreen';
import { EntrenamientoScreen } from '../screens/EntrenamientoScreen';
import { HistorialScreen } from '../screens/HistorialScreen';
import { EstadisticasScreen } from '../screens/EstadisticasScreen';
import { AjustesScreen } from '../screens/AjustesScreen';
import { CalendarioScreen } from '../screens/CalendarioScreen';
import { CalculadoraScreen } from '../screens/CalculadoraScreen';
import { MedidasScreen } from '../screens/MedidasScreen';
import { EntrenamientoLibreScreen } from '../screens/EntrenamientoLibreScreen';
import { PlantillasScreen } from '../screens/PlantillasScreen';
import { ResumenEstadisticasScreen } from '../screens/ResumenEstadisticasScreen';
import { useColors } from '../utils/ThemeContext';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { colors, isDark } = useColors();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.bg,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  const screenOptions = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
    headerShadowVisible: false,
    cardStyle: { backgroundColor: colors.bg },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CrearRutina"
          component={CrearRutinaScreen}
          options={{ title: 'Nueva rutina' }}
        />
        <Stack.Screen
          name="EditarRutina"
          component={EditarRutinaScreen}
          options={{ title: 'Editar rutina' }}
        />
        <Stack.Screen
          name="Biblioteca"
          component={BibliotecaScreen}
          options={{ title: 'Ejercicios' }}
        />
        <Stack.Screen
          name="DetalleRutina"
          component={DetalleRutinaScreen}
          options={{ title: 'Detalle' }}
        />
        <Stack.Screen
          name="Entrenamiento"
          component={EntrenamientoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Historial"
          component={HistorialScreen}
          options={{ title: 'Historial' }}
        />
        <Stack.Screen
          name="Estadisticas"
          component={EstadisticasScreen}
          options={{ title: 'Progreso' }}
        />
        <Stack.Screen
          name="Ajustes"
          component={AjustesScreen}
          options={{ title: 'Ajustes' }}
        />
        <Stack.Screen
          name="Calendario"
          component={CalendarioScreen}
          options={{ title: 'Calendario' }}
        />
        <Stack.Screen
          name="Calculadora"
          component={CalculadoraScreen}
          options={{ title: 'Calculadora 1RM' }}
        />
        <Stack.Screen
          name="Medidas"
          component={MedidasScreen}
          options={{ title: 'Medidas corporales' }}
        />
        <Stack.Screen
          name="EntrenamientoLibre"
          component={EntrenamientoLibreScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Plantillas"
          component={PlantillasScreen}
          options={{ title: 'Plantillas' }}
        />
        <Stack.Screen
          name="ResumenEstadisticas"
          component={ResumenEstadisticasScreen}
          options={{ title: 'Estadísticas' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
