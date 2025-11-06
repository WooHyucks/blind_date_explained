/**
 * 이벤트 트래킹 유틸리티
 * Google Analytics, Mixpanel, 또는 다른 분석 도구로 확장 가능
 */

// Window 인터페이스 확장
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params?: Record<string, unknown>
    ) => void;
    mixpanel?: {
      track: (event: string, params?: Record<string, unknown>) => void;
    };
  }
}

export type EventCategory = 
  | 'page_view'
  | 'navigation'
  | 'form'
  | 'survey'
  | 'social';

export type EventAction = 
  | 'landing_page_view'
  | 'instagram_click'
  | 'notification_signup'
  | 'survey_submit'
  | 'survey_option_select';

export interface EventParams {
  category?: EventCategory;
  label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 이벤트 트래킹 함수
 * @param action - 이벤트 액션
 * @param params - 추가 파라미터
 */
export const trackEvent = (action: EventAction, params?: EventParams) => {
  // 개발 환경에서는 console.log로 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', action, params);
  }

  // Google Analytics 4 (gtag) 사용 시
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: params?.category || 'engagement',
      event_label: params?.label,
      value: params?.value,
      ...params,
    });
  }

  // Mixpanel 사용 시
  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.track(action, params);
  }

  // 커스텀 분석 API 호출 (필요시)
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ action, ...params }),
  // }).catch(console.error);
};

/**
 * 페이지 뷰 이벤트
 */
export const trackPageView = (path?: string) => {
  const pagePath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  trackEvent('landing_page_view', {
    category: 'page_view',
    label: pagePath,
  });
};

/**
 * 인스타그램 클릭 이벤트
 */
export const trackInstagramClick = () => {
  trackEvent('instagram_click', {
    category: 'social',
    label: 'instagram_link',
  });
};

/**
 * 알림받기 폼 제출 이벤트
 */
export const trackNotificationSignup = (hasEmail: boolean) => {
  trackEvent('notification_signup', {
    category: 'form',
    label: hasEmail ? 'email' : 'kakao_id',
    value: 1,
  });
};

/**
 * 설문 항목 선택 이벤트
 */
export const trackSurveyOptionSelect = (
  questionType: 'gender' | 'age' | 'interest' | 'source' | 'reaction',
  value: string
) => {
  trackEvent('survey_option_select', {
    category: 'survey',
    label: `${questionType}_${value}`,
    question_type: questionType,
    selected_value: value,
  });
};

/**
 * 설문 제출 이벤트
 */
export const trackSurveySubmit = (answers: {
  gender: string;
  ageGroup: string;
  interest: string;
  source: string;
  reaction: string;
}) => {
  trackEvent('survey_submit', {
    category: 'survey',
    label: 'survey_completed',
    value: 1,
    ...answers,
  });
};

