import { createNavigationContainerRef } from "@react-navigation/native";
import { RootNavigatorParamList } from "../types";

export const navigationRef = createNavigationContainerRef<RootNavigatorParamList>();

export const goToAuthenticatedRoot = () => {
  if (!navigationRef.isReady()) return;

  if (navigationRef.canGoBack()) {
    navigationRef.goBack();
    return;
  }

  navigationRef.navigate("AuthenticatedStack");
};
