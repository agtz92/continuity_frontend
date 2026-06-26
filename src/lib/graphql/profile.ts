import { gql } from "@apollo/client";
import { ONBOARDING_STATE_FIELDS, TODAY_LAYOUT_FIELDS } from "./fragments";

export const PROFILE_QUERY = gql`
  query Profile {
    profile {
      avatar
      firstName
    }
  }
`;

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Estado del flujo de onboarding (paso actual, tour, plan); reutilizado por la query y
// todas las mutations que avanzan/cierran el onboarding.

export const ONBOARDING_STATE_QUERY = gql`
  query OnboardingState {
    onboardingState {
      ${ONBOARDING_STATE_FIELDS}
    }
  }
`;


export const SET_ONBOARDING_STEP = gql`
  mutation SetOnboardingStep($step: Int!) {
    setOnboardingStep(step: $step) {
      ${ONBOARDING_STATE_FIELDS}
    }
  }
`;


export const COMPLETE_ONBOARDING = gql`
  mutation CompleteOnboarding($mode: String) {
    completeOnboarding(mode: $mode) {
      ${ONBOARDING_STATE_FIELDS}
    }
  }
`;


export const MARK_TOUR = gql`
  mutation MarkTour($seen: Boolean!) {
    markTour(seen: $seen) {
      ${ONBOARDING_STATE_FIELDS}
    }
  }
`;

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Layout personalizable de la vista Today (orden y módulos ocultos); reutilizado por la
// query y las mutations de update/reset.

export const TODAY_LAYOUT_QUERY = gql`
  query TodayLayout {
    todayLayout {
      ${TODAY_LAYOUT_FIELDS}
    }
  }
`;


export const UPDATE_TODAY_LAYOUT = gql`
  mutation UpdateTodayLayout($order: [String!], $hidden: [String!]) {
    updateTodayLayout(order: $order, hidden: $hidden) {
      ${TODAY_LAYOUT_FIELDS}
    }
  }
`;


export const RESET_TODAY_LAYOUT = gql`
  mutation ResetTodayLayout {
    resetTodayLayout {
      ${TODAY_LAYOUT_FIELDS}
    }
  }
`;

// ===== Feed de actividad (paginado/filtrable) =====
