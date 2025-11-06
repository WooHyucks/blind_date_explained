"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import * as amplitude from "@amplitude/analytics-browser";

export default function Home() {
  const [emailOrId, setEmailOrId] = useState("");
  const [reaction, setReaction] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [interest, setInterest] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [source, setSource] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasStartedSurvey, setHasStartedSurvey] = useState(false);
  const [scrollDepthTracked, setScrollDepthTracked] = useState(false);
  const [isInterestSubmitting, setIsInterestSubmitting] = useState(false);
  const [isInterestSubmitted, setIsInterestSubmitted] = useState(false);
  const surveyProgressRef = useRef<number>(0);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const stagger = {
    show: { transition: { staggerChildren: 0.12 } },
  };

  // 익명 사용자 ID 생성 또는 가져오기
  const getOrCreateAnonymousUserId = (): string => {
    if (typeof window === 'undefined') return '';
    
    const storageKey = 'sogaeting_anonymous_user_id';
    let userId = localStorage.getItem(storageKey);
    
    if (!userId) {
      // UUID v4 형식으로 생성 (간단한 버전)
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(storageKey, userId);
    }
    
    return userId;
  };

  // Amplitude 이벤트 트래킹 헬퍼 (익명 사용자 ID 자동 포함)
  const trackEvent = useCallback((eventName: string, eventProperties?: Record<string, unknown>) => {
    const apiKey = (process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "").trim();
    if (apiKey && apiKey.length > 0) {
      try {
        const anonymousUserId = getOrCreateAnonymousUserId();
        amplitude.track(eventName, {
          ...eventProperties,
          anonymous_user_id: anonymousUserId,
        });
      } catch (error) {
        console.warn(`Amplitude 이벤트 트래킹 실패 [${eventName}]:`, error);
      }
    }
  }, []);

  // Amplitude 초기화 및 페이지 뷰 이벤트
  useEffect(() => {
    // Amplitude API 키는 환경변수에서 가져오거나 하드코딩
    const apiKey = (process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "").trim();
    
    if (apiKey && apiKey.length > 0) {
      try {
        // Amplitude 초기화
        amplitude.init(apiKey);
        
        // 익명 사용자 ID 생성 및 설정
        const anonymousUserId = getOrCreateAnonymousUserId();
        amplitude.setUserId(anonymousUserId);
        
        // 페이지 뷰 이벤트
        trackEvent("view landing");
        
        console.log(`익명 사용자 ID: ${anonymousUserId}`);
      } catch (error) {
        console.warn("Amplitude 초기화 실패:", error);
      }
    }

    // 스크롤 뎁스 트래킹 (50%)
    const handleScroll = () => {
      if (scrollDepthTracked) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;

      if (scrollPercent >= 50) {
        trackEvent("scroll depth", { depth_percent: 50 });
        setScrollDepthTracked(true);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // 설문 이탈 트래킹
    const handleBeforeUnload = () => {
      if (hasStartedSurvey && !isSubmitted) {
        const progress = surveyProgressRef.current;
        trackEvent("abandon survey", { progress_percent: progress });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [scrollDepthTracked, hasStartedSurvey, isSubmitted, trackEvent]);

  const onSubmitSurvey = async () => {
    // source는 UI에서 제거되었지만 나중을 위해 주석 처리
    if (!gender || !ageGroup || !interest || !reaction) {
      alert("모든 질문에 답변해주세요.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 실제 API 호출로 대체
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 시뮬레이션
      
      // key를 label로 변환하는 매핑
      const genderLabels: Record<string, string> = {
        "male": "남성",
        "female": "여성",
      };
      
      const ageGroupLabels: Record<string, string> = {
        "20-24": "20~24세",
        "25-29": "25~29세",
        "30-34": "30~34세",
        "35-39": "35~39세",
        "40+": "40세 이상",
      };
      
      const interestLabels: Record<string, string> = {
        "yes": "네, 참여하고 싶어요",
        "maybe": "생각해볼게요",
        "no": "아직 잘 모르겠어요",
      };
      
      const reactionLabels: Record<string, string> = {
        "love": "완전 흥미로워요",
        "curious": "궁금해요, 어떻게 진행돼요?",
        "nervous": "재밌긴 한데 조금 낯설어요",
        "unknown": "아직 잘 모르겠어요",
      };
      
      // 모든 설문 내용을 객체로 구성
      const surveyData = {
        gender: genderLabels[gender] || gender,
        age_group: ageGroupLabels[ageGroup] || ageGroup,
        interest: interestLabels[interest] || interest,
        reaction: reactionLabels[reaction] || reaction,
      };
      
      console.log("Survey submitted:", surveyData);

      // 설문 제출 이벤트 (모든 설문 내용 포함)
      trackEvent("submit survey", surveyData);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting survey:", error);
      alert("설문 제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const contactValue = emailOrId.trim();
    if (!contactValue) {
      alert("이메일 또는 ID를 입력해주세요.");
      return;
    }

    setIsInterestSubmitting(true);

    try {
      // Amplitude 이벤트 전송 (입력값 포함)
      const hasEmail = contactValue.includes("@");
      const contactType = hasEmail ? "email" : (contactValue.length > 0 ? "instagram_id" : "kakao_id");
      
      trackEvent("submit interest", {
        contact_type: contactType,
        contact_value: contactValue,
        has_value: contactValue.length > 0,
      });

      // 실제 API 호출로 대체
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 시뮬레이션
      
      // 성공 시
      setIsInterestSubmitted(true);
      setEmailOrId("");
      
      // 3초 후 메시지 숨기기 (선택사항)
      setTimeout(() => {
        setIsInterestSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting interest:", error);
      alert("알림받기 설정 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsInterestSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#FFF5F5] text-[#222]">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-[#FFE8E8]"
      >
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <motion.a
              href="#"
              className="text-base md:text-lg font-semibold text-[#222] hover:text-[#FF6B6B] transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <Image src="/logo.png" alt="Logo" width={100} height={100} className="md:w-[100px] md:h-[100px] w-20 h-20" />
            </motion.a>
            <nav className="flex items-center gap-4">
              <a
                href="#about"
                className="text-xs md:text-sm text-[#666] hover:text-[#FF6B6B] transition-colors hidden sm:block"
              >
                소개
              </a>
              <a
                href="#signup"
                className="text-xs md:text-sm text-[#666] hover:text-[#FF6B6B] transition-colors hidden sm:block"
              >
                알림받기
              </a>
              <a
                href="https://www.instagram.com/blind_date_explained/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="opacity-60 hover:opacity-100 transition-opacity"
                onClick={() => trackEvent("click instagram")}
              >
                <Image src="/instagram.svg" alt="Instagram" width={18} height={18} />
              </a>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Container */}
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        {/* 1) Hero Section */}
        <section id="about" className="pt-28 md:pt-32 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#FFF5F5] via-[#FFE8E8] to-[#FFD9D9] p-10 md:p-16 shadow-lg border border-[#FFE8E8]/50"
          >
            {/* 배경 웨이브 패턴 */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B6B]/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF9E9E]/10 rounded-full blur-3xl"></div>
            </div>
            
            {/* 지하철 스크린도어 시각화 */}
            <div className="relative max-w-2xl mx-auto z-10">
              {/* 스크린도어 구조 */}
              <div className="flex items-center justify-center gap-4 md:gap-6 my-8">
                {/* 왼쪽 플랫폼 + 스크린도어 */}
                <div className="flex-1 relative">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative bg-white/70 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-xl border border-white/50"
                  >
                    {/* 글로우 효과 */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FF6B6B]/20 to-transparent opacity-50"></div>
                    {/* 실루엣 */}
                    <div className="flex items-center justify-center h-28 md:h-36 relative z-10">
                      <div className="relative">
                        <div className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#FF6B6B]/30 to-[#FF9E9E]/30 blur-xl"></div>
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#FF6B6B]/40 via-[#FF9E9E]/30 to-[#FFD9D9]/20 flex items-center justify-center shadow-inner">
                          <span className="text-3xl md:text-4xl">🙋🏻</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {/* 왼쪽 스크린도어 */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex flex-col items-center gap-1 z-20"
                  >
                    <div className="w-1.5 h-24 md:h-28 bg-gradient-to-b from-[#FF6B6B] via-[#FF9E9E] to-[#FFD9D9] rounded-full shadow-lg shadow-[#FF6B6B]/50"></div>
                  </motion.div>
                </div>
                
                {/* 중앙 열차 영역 */}
                <div className="relative flex flex-col items-center gap-2 z-10">
                  <div className="relative bg-gradient-to-b from-[#222]/10 via-[#222]/20 to-[#222]/10 rounded-lg px-4 md:px-6 py-8 md:py-10 border border-[#222]/20 shadow-lg w-full">
                    {/* 왼쪽에서 오는 열차 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2"
                    >

                    </motion.div>
                    
                    {/* 오른쪽에서 오는 열차 */}
                    
                    {/* 중앙 레일 */}
                    <div className="h-px bg-[#222]/20 w-full"></div>

                    
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-[#666] whitespace-nowrap bg-white/60 rounded-full px-3 py-1 backdrop-blur-sm">
                    열차
                  </div>
                </div>

                <div className="relative flex flex-col items-center gap-2 z-10">

                  <div className="relative bg-gradient-to-b from-[#222]/10 via-[#222]/20 to-[#222]/10 rounded-lg px-4 md:px-6 py-8 md:py-10 border border-[#222]/20 shadow-lg w-full">
                    {/* 왼쪽에서 오는 열차 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2"
                    >


                    </motion.div>
                    
                    {/* 오른쪽에서 오는 열차 */}
                    
                    {/* 중앙 레일 */}
                    <div className="h-px bg-[#222]/20 w-full"></div>

                    
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-[#666] whitespace-nowrap bg-white/60 rounded-full px-3 py-1 backdrop-blur-sm">
                    열차
                  </div>
                </div>
                
                
                {/* 오른쪽 플랫폼 + 스크린도어 */}
                <div className="flex-1 relative">
                  {/* 오른쪽 스크린도어 */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20"
                  >
                    <div className="w-1.5 h-24 md:h-28 bg-gradient-to-b from-[#FFD9D9] via-[#FF9E9E] to-[#FF6B6B] rounded-full shadow-lg shadow-[#FF6B6B]/50"></div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="relative bg-white/70 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-xl border border-white/50"
                  >
                    {/* 글로우 효과 */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-bl from-[#FF6B6B]/20 to-transparent opacity-50"></div>
                    {/* 실루엣 */}
                    <div className="flex items-center justify-center h-28 md:h-36 relative z-10">
                      <div className="relative">
                        <div className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#FF6B6B]/30 to-[#FF9E9E]/30 blur-xl"></div>
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#FF6B6B]/40 via-[#FF9E9E]/30 to-[#FFD9D9]/20 flex items-center justify-center shadow-inner">
                          <span className="text-3xl md:text-4xl">🙋🏻‍♀️</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* 문구 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-center mt-8"
              >
                <p className="text-sm md:text-base text-[#666] font-medium bg-white/40 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                  반대편에서 만나는 첫인상
                </p>
              </motion.div>
            </div>
          </motion.div>
          
          <div className="mx-auto mt-8 h-1 w-20 bg-gradient-to-r from-transparent via-[#FF6B6B] to-transparent rounded-full blur-sm" />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className=" text-center space-y-5"
          >
            {/* <motion.h1
              variants={fadeUp}
              className="text-2xl md:text-3xl font-semibold tracking-tight text-[#222]"
            >
              소개팅이 열립니다✨
            </motion.h1> */}
            <motion.p
              variants={fadeUp}
              className="text-sm md:text-base text-[#666] leading-relaxed font-medium"
            >
              스크린도어가 열리면, 인연도 함께 열립니다.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="text-base md:text-base text-[#444] leading-relaxed max-w-xl mx-auto font-medium"
            >
              지하철 반대편 스크린도어에서, <span className="font-bold text-[#222]">첫인상으로만</span> 연결되는 새로운 소개팅 실험.
              <br className="hidden md:block" />
<span className="font-bold text-[#222]">눈빛 하나로</span> 인연이 열리는 순간을 상상해보세요.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="text-xs md:text-sm text-[#666] leading-relaxed max-w-xl mx-auto mt-4"
            >
              **완전 블라인드는 아니라서, 참여 전 기본 신상정보와 사진 1장을 확인해<br className="hidden md:inline" />
              안전하고 신뢰할 수 있는 매칭을 위해 노력합니다.**
            </motion.p>
          </motion.div>
        </section>

        {/* 2) Concept Section */}
        <section className="pb-12  md:pb-14 ">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="rounded-xl p-6 md:p-8 bg-white shadow-sm border border-[#FFE8E8]"
          >
            <h2 className="text-base md:text-xl font-semibold mb-5 text-[#222]">
              첫인상은, 스크린을 넘어 현실에서 느껴야 하니까 🤔
            </h2>
            <div className="space-y-4 text-sm md:text-base leading-relaxed text-[#555]">
              <p className="font-medium">
                <span className="font-semibold text-[#222]">소개팅 앱의 사진과 실제는 다릅니다.</span>
                <br />
                우리는 많은 사람들이 첫인상에서 연인으로 발전할 가능성을 판단한다고 믿습니다.
              </p>
              <p className="pt-3 border-t font-medium border-[#FFE8E8]">
                그런데 막상 만났을 때, 외모가 마음에 안 들어도 거절하기 쉽지 않죠.
                <br />
                <span className="font-semibold text-[#222]">서로 쓰고 싶지 않은 시간과 돈을 낭비하는 일</span>을 방지하고 싶습니다.
              </p>
              <p className="pt-3 text-[#FF6B6B] font-semibold">
                지하철 스크린도어 앞에서, <span className="font-bold">10초의 첫인상</span>으로 결정하세요.
                <br />
                마음에 들면 타지 않고, 아니면 그냥 열차에 탑승하면 됩니다.
              </p>
            </div>
          </motion.div>
        </section>

        {/* 3) Survey Section */}
        <section className="pb-12 md:pb-16">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl p-8 md:p-10 bg-white shadow-sm border border-[#FFE8E8] text-center"
            >
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#222]">
                설문에 참여해주셔서 감사합니다!
              </h3>
              <p className="text-sm md:text-base text-[#666]">
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
              className="rounded-xl p-6 md:p-8 bg-white shadow-sm border border-[#FFE8E8]"
            >
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold mb-2 text-[#222]">
                  💌 단 10초면 끝나요! 여러분의 설문이      <br /> &ldquo;소개팅이 열립니다&rdquo; 첫 실험을 만들어가요 🙇🏻
                </h3>

                <p className="text-sm font-medium md:text-base text-[#666]">
                  👉 지금 참여하고, 첫 실험 소식을 가장 먼저 받아보세요!
                </p>
              </div>

              <div className="space-y-6">
                {/* 성별 */}
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-3">
                    성별을 알려주세요
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { key: "male", label: "남성" },
                      { key: "female", label: "여성" },
                    ].map((item) => (
                      <motion.button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setGender(item.key);
                          // 첫 설문 항목 클릭 시 start survey 이벤트
                          if (!hasStartedSurvey) {
                            trackEvent("start survey");
                            setHasStartedSurvey(true);
                          }
                          // 성별 선택 이벤트 (label 전송)
                          trackEvent("select gender", { gender: item.label });
                          surveyProgressRef.current = Math.round((1 / 5) * 100);
                        }}
                        disabled={isSubmitting}
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`rounded-lg px-4 py-3 text-sm font-medium border transition-colors ${
                          gender === item.key
                            ? "border-[#FF6B6B] bg-[#FFF5F5] text-[#FF6B6B]"
                            : "border-[#FFE8E8] bg-white text-[#444] hover:border-[#FFD9D9]"
                        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {item.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 나이대 */}
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-3">
                    나이대를 알려주세요
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: "20-24", label: "20~24세" },
                      { key: "25-29", label: "25~29세" },
                      { key: "30-34", label: "30~34세" },
                      { key: "35-39", label: "35~39세" },
                      { key: "40+", label: "40세 이상" },
                    ].map((item) => (
                      <motion.button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setAgeGroup(item.key);
                          trackEvent("select age group", { age_group: item.label });
                          surveyProgressRef.current = Math.round((2 / 5) * 100);
                        }}
                        disabled={isSubmitting}
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`rounded-lg px-4 py-2.5 text-xs md:text-sm font-medium border transition-colors ${
                          ageGroup === item.key
                            ? "border-[#FF6B6B] bg-[#FFF5F5] text-[#FF6B6B]"
                            : "border-[#FFE8E8] bg-white text-[#444] hover:border-[#FFD9D9]"
                        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {item.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 참여 의사 */}
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-3">
                    참여 의사가 있으신가요?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: "yes", label: "네, 참여하고 싶어요" },
                      { key: "maybe", label: "생각해볼게요" },
                      { key: "no", label: "아직 잘 모르겠어요" },
                    ].map((item) => (
                      <motion.button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setInterest(item.key);
                          trackEvent("select interest", { interest: item.label });
                          surveyProgressRef.current = Math.round((3 / 5) * 100);
                        }}
                        disabled={isSubmitting}
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`rounded-lg px-4 py-2.5 text-xs md:text-sm font-medium border transition-colors ${
                          interest === item.key
                            ? "border-[#FF6B6B] bg-[#FFF5F5] text-[#FF6B6B]"
                            : "border-[#FFE8E8] bg-white text-[#444] hover:border-[#FFD9D9]"
                        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {item.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                
                {/* 감정 폴 */}
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-3">
                    이 아이디어, 당신은 어떻게 느끼시나요?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: "love", emoji: "❤️", label: "완전 흥미로워요" },
                      { key: "curious", emoji: "👀", label: "궁금해요, 어떻게 진행돼요?" },
                      { key: "nervous", emoji: "🤔", label: "재밌긴 한데 조금 낯설어요" },
                      { key: "unknown", emoji: "🚇", label: "아직 잘 모르겠어요" },
                    ].map((item) => (
                      <motion.button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setReaction(item.key);
                          trackEvent("select reaction", { reaction: item.label });
                          surveyProgressRef.current = Math.round((4 / 5) * 100);
                        }}
                        disabled={isSubmitting}
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`rounded-lg px-4 py-3 text-sm font-medium border transition-colors text-left flex items-center gap-2.5 ${
                          reaction === item.key
                            ? "border-[#FF6B6B] bg-[#FFF5F5] text-[#FF6B6B]"
                            : "border-[#FFE8E8] bg-white text-[#444] hover:border-[#FFD9D9]"
                        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span className="text-lg" aria-hidden>
                          {item.emoji}
                        </span>
                        <span className="text-xs md:text-sm leading-snug">
                          {item.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 안내 멘트 */}
                <div className="pt-4 border-t border-[#FFE8E8]">
                  <div className="space-y-2">
                    <p className="text-xs text-[#999] leading-relaxed">
                      수집된 정보는 <span className="font-medium text-[#222]">매칭 및 오픈 알림</span> 용도로만 사용되며, 
                      <span className="font-medium text-[#222]"> 외부에 공개되거나 다른 용도로 사용되지 않습니다</span>.
                      <br />
                      실험 종료 후 즉시 폐기됩니다.
          </p>
        </div>
                </div>

                {/* 제출 버튼 */}
                <div className="pt-2">
                  <motion.button
                    type="button"
                    onClick={onSubmitSurvey}
                    disabled={isSubmitting || !gender || !ageGroup || !interest || !reaction}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="w-full rounded-lg bg-gradient-to-r from-[#FF9E9E] to-[#FF6B6B] text-white font-medium px-6 py-3 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        제출 중...
                      </>
                    ) : (
                      "설문 제출하기"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* 4) Interest Form Section (CTA) */}
        <section id="signup" className="pb-10 md:pb-12">
          {isInterestSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl bg-gradient-to-r from-[#FF9E9E] to-[#FF6B6B] p-6 md:p-8 text-white shadow-sm text-center"
            >
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">
                알림 받기 설정이 완료되었습니다!
              </h3>
              <p className="text-sm md:text-base opacity-90">
                첫 실험 소식을 가장 먼저 받아보세요.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8 }}
              className="rounded-xl bg-gradient-to-r from-[#FF9E9E] to-[#FF6B6B] p-6 md:p-8 text-white shadow-sm"
            >
              <div className="text-center max-w-xl mx-auto">
                <h3 className="text-lg md:text-xl font-semibold leading-relaxed">

                </h3>
                <p className="mt-2 text-sm md:text-base opacity-90 leading-relaxed">
                  지금, &ldquo;소개팅이 열립니다&rdquo;의 첫 소식을 받아보세요.
                </p>

                <form onSubmit={onSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    placeholder="이메일 또는 카카오톡 ID 또는 인스타그램 ID"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    disabled={isInterestSubmitting}
                    className="flex-1 rounded-full px-4 py-3 text-sm text-[#222] bg-white placeholder:text-[#999] border-2 border-white/80 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <motion.button
                    type="submit"
                    disabled={isInterestSubmitting}
                    whileHover={isInterestSubmitting ? {} : { scale: 1.02 }}
                    whileTap={isInterestSubmitting ? {} : { scale: 0.98 }}
                    className="rounded-full bg-white text-[#FF6B6B] font-medium px-6 py-3 text-sm shadow-sm whitespace-nowrap border-2 border-white hover:bg-[#FFF5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isInterestSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-[#FF6B6B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        처리 중...
                      </>
                    ) : (
                      "알림받기"
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}

          {/* 5) Privacy Notice */}
          <div className="max-w-xl mx-auto mt-12 rounded-lg bg-white/80 text-[#555] p-4 text-xs shadow-sm border border-[#FFE8E8]">
            제출하신 이메일 또는 ID는 <span className="font-medium text-[#222]">오픈 알림 발송</span> 용도로만 사용되며,
            외부에 공개되거나 다른 용도로 사용되지 않습니다.
            <br />
            테스트 종료 후 즉시 폐기됩니다.
          </div>
        </section>

        {/* 6) Footer */}
        <footer className="border-t border-[#FFE8E8] text-[#666] text-center py-8 mt-12">
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs md:text-sm">
              © 2025 소개팅이 열립니다 — 지하철 첫인상 매칭 실험
            </p>
            <p className="text-xs opacity-70">
              스크린도어가 아닌, 인연의 도어가 열립니다.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <a 
                href="https://www.instagram.com/blind_date_explained/" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram" 
                className="opacity-60 hover:opacity-100 transition-opacity"
                onClick={() => trackEvent("click instagram")}
              >
                <Image src="/instagram.svg" alt="Instagram" width={18} height={18} />
              </a>
            </div>
          </div>
        </footer>
        </div>
      </main>
  );
}
