import { withLayoutContext } from 'expo-router';
import { createBlankStackNavigator } from 'react-native-screen-transitions/blank-stack';
import type {
  BlankStackNavigationEventMap,
  BlankStackNavigationOptions,
} from 'react-native-screen-transitions/blank-stack';
import type { ParamListBase, StackNavigationState } from '@react-navigation/native';

const { Navigator } = createBlankStackNavigator();

export const TransitionStack = withLayoutContext<
  BlankStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  BlankStackNavigationEventMap
>(Navigator);
