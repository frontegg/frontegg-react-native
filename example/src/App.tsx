import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import { FronteggWrapper } from '@frontegg/react-native';

const Stack = createNativeStackNavigator();

export default () => {
  return (
    <FronteggWrapper>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </FronteggWrapper>
  );
};

/**
 - custom login per tenant
 - nextjs sub-domain
 - app directory
 */
