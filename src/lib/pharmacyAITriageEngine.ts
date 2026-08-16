/**
 * @file pharmacyAITriageEngine.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: pharmacyAITriageEngine.ts.
 */
// MARO ERP - Autonomous Clinical Pharmacy & OTC Triage AI Engine
// Master Enterprise Medical & Pharmaceutical Protocol v4.0

export interface TriageQuestion {
  id: string;
  text: string;
  options: {
    label: string;
    value: string;
    description?: string;
    isHighRisk?: boolean;
  }[];
}

export interface TriageCondition {
  id: string;
  name: string;
  category: string;
  iconName: string;
  description: string;
  samplePatientComplaint: string;
}

export interface RecommendedDrug {
  id: string;
  name: string;
  genericName: string;
  category: string;
  unitPrice: number;
  dosage: string;
  timing: string;
  duration: string;
  shelfLocation: string;
  barcode: string;
  safetyReason: string;
}

export interface TriageAssessmentResult {
  conditionTitle: string;
  patientSummary: string;
  clinicalDiagnosis: string;
  severityLevel: 'MILD_OTC' | 'MODERATE_MONITORED' | 'HIGH_DOCTOR_REFERRAL';
  contraindications: string[];
  safeMedications: RecommendedDrug[];
  nonPharmAdvice: string[];
  redFlags: string[];
}

export class PharmacyAITriageEngine {
  public static availableConditions: TriageCondition[] = [
    {
      id: 'cold_flu',
      name: 'نزلات البرد والإنفلونزا (Cold & Flu)',
      category: 'الجهاز التنفسي العلوي',
      iconName: 'Thermometer',
      description: 'رشح، احتقان أنف، تكسير بالجسم، عطس، حرارة خفيفة أو متوسطة',
      samplePatientComplaint: 'عندي برد جامد وجسمي مكسر ومناخيري مسدودة وعايز علاج يوقف الرشح والاحتقان'
    },
    {
      id: 'cough_wet_dry',
      name: 'الكحة والسعال (Cough - Dry / Productive)',
      category: 'الجهاز التنفسي',
      iconName: 'Wind',
      description: 'كحة جافة مهيجة أو كحة رطبة مصحوبة ببلغم ومخاط صدري',
      samplePatientComplaint: 'عندي كحة بقالها 3 أيام ومش عارف أنام منها، وعايز دواء يهدي صدري'
    },
    {
      id: 'sore_throat',
      name: 'احتقان والتهاب الحلق (Sore Throat & Pharyngitis)',
      category: 'الأنف والأذن والحنجرة',
      iconName: 'Activity',
      description: 'صعوبة بالبلع، وخز وألم بالحلق، بحة صوت',
      samplePatientComplaint: 'زوري بيحرقني ومش قادر أبلع ريقي من الصبح'
    },
    {
      id: 'headache_pain',
      name: 'الصداع وآلام الجسم (Headache & Myalgia)',
      category: 'المسكنات والآلام',
      iconName: 'Zap',
      description: 'صداع نصفي أو توتري أو صداع الجيوب الأنفية مع إجهاد عام',
      samplePatientComplaint: 'عندي صداع نصفي شديد وضغط خلف عيني ومحتاج مسكن سريع'
    },
    {
      id: 'gerd_gastric',
      name: 'الحموضة والمغص وسوء الهضم (GERD & Gastric Dyspepsia)',
      category: 'الجهاز الهضمي',
      iconName: 'Flame',
      description: 'حرقة فم المعدة، ارتجاع مريء، انتفاخ، تقلصات معوية',
      samplePatientComplaint: 'حاسس بنار في صدري ومعدتي ومغص شديد بعد الأكل'
    },
    {
      id: 'allergic_rhinitis',
      name: 'الحساسية الموسمية والجيوب الأنفية (Allergic Rhinitis)',
      category: 'الحساسية والمناعة',
      iconName: 'Sparkles',
      description: 'حكة بالعينين والأنف، عطس مستمر، سيلان مائي شفاف',
      samplePatientComplaint: 'عيني بتدمع وبهرش في مناخيري وبعطس متواصل مع تغير الجو'
    }
  ];

  // Generate interactive triage questions based on condition
  public static getTriageQuestions(conditionId: string): TriageQuestion[] {
    const baseQuestions: TriageQuestion[] = [
      {
        id: 'patient_profile',
        text: 'ما هي الفئة العمرية والحالة الفسيولوجية للمريض؟',
        options: [
          { label: 'بالغ سليم (18 - 60 سنة)', value: 'adult_healthy', description: 'لا توجد قيود فسيولوجية خاصة' },
          { label: 'طفل (من سنتين إلى 11 سنة)', value: 'child', description: 'تجنب أدوية البالغين والأسبرين، حساب الجرعة بالوزن' },
          { label: 'رضيع (أقل من سنتين)', value: 'infant', description: 'حالة حرجة تتطلب استشارة طبيب أطفال فورا', isHighRisk: true },
          { label: 'سيدة حامل (Pregnant)', value: 'pregnant', description: 'ممنوع معظم مزيلات الاحتقان والـ NSAIDs', isHighRisk: true },
          { label: 'أم مرضع (Lactating)', value: 'lactating', description: 'اختيار أدوية لا تفرز في حليب الأم' },
          { label: 'كبير السن (فوق 65 سنة)', value: 'elderly', description: 'مراعاة وظائف الكلى وتجنب مضادات الكولين المسببة للدوار' }
        ]
      },
      {
        id: 'chronic_diseases',
        text: 'هل يعاني المريض من أي أمراض مزمنة؟',
        options: [
          { label: 'لا يعاني من أي أمراض مزمنة', value: 'none', description: 'الحالة آمنة للاستخدام القياسي' },
          { label: 'ارتفاع ضغط الدم (Hypertension) / قلب', value: 'hypertension', description: '⛔ ممنوع أدوية البرد المحتوية على Pseudoephedrine/Phenylephrine', isHighRisk: true },
          { label: 'قرحة المعدة / نزيف الجهاز الهضمي (Peptic Ulcer)', value: 'ulcer', description: '⛔ ممنوع مسكنات NSAIDs (مثل بروفين وديكلوفيناك وفولتارين)', isHighRisk: true },
          { label: 'حساسية الصدر والربو (Asthma / COPD)', value: 'asthma', description: 'تجنب المسكنات المثبطة للتنفس وبعض مضادات الالتهاب', isHighRisk: true },
          { label: 'السكري (Diabetes)', value: 'diabetes', description: 'تفضيل أدوية وشرابات خالية من السكر Sugar-Free' },
          { label: 'قصور في وظائف الكلى أو الكبد', value: 'renal_hepatic', description: 'تجنب الجرعات العالية من الباراسيتامول ومدرات البول', isHighRisk: true }
        ]
      }
    ];

    if (conditionId === 'cold_flu' || conditionId === 'allergic_rhinitis') {
      baseQuestions.push({
        id: 'symptom_nature',
        text: 'ما هي الأعراض البارزة الأكثر إزعاجاً للمريض؟',
        options: [
          { label: 'انسداد أنف شديد مع رشح وتكسير بالجسم بدون كحة', value: 'congestion_bodyache', description: 'يركز على مضادات الهيستامين والمسكنات' },
          { label: 'رشح وعطس متواصل مع حكة عين وإفرازات مائية', value: 'runny_sneezing', description: 'يرجح حساسية أو بداية نزلة برد' },
          { label: 'برد مصحوب بكحة ببلغم وصوت أزيز بالصدر', value: 'cold_with_wet_cough', description: 'يحتاج مذيب وطارد للبلغم مع علاج البرد' },
          { label: 'حرارة مرتفعة جداً (> 38.5) مع قشعريرة شديدة وألم بالحلق', value: 'high_fever_sorethroat', description: 'قد تكون إنفلونزا حادة أو التهاب لوزتين بكتيري', isHighRisk: true }
        ]
      });
    } else if (conditionId === 'cough_wet_dry') {
      baseQuestions.push({
        id: 'cough_type',
        text: 'ما هي طبيعة الكحة (السعال)؟',
        options: [
          { label: 'كحة جافة شاردة (Dry Cough) بدون أي إفرازات', value: 'dry_cough', description: 'تحتاج مهديء كحة ومضاد للسعال المركزي أو الموضعي' },
          { label: 'كحة رطبة مصحوبة ببلغم ومخاط (Productive Wet Cough)', value: 'wet_cough', description: 'تحتاج مذيب وطارد للبلغم (Mucolytic / Expectorant)' },
          { label: 'كحة مع ضيق تنفس حاد وتزييق بالصدر عند النوم', value: 'wheezing_dyspnea', description: 'اشتباه أزمة ربوية أو التهاب شعبي حاد', isHighRisk: true }
        ]
      });
    } else if (conditionId === 'gerd_gastric') {
      baseQuestions.push({
        id: 'gastric_nature',
        text: 'أين يتركز الألم والانزعاج الهضمي؟',
        options: [
          { label: 'حرقة وصعود أحماض لفم المعدة والمريء بعد الأكل أو الاستلقاء', value: 'heartburn_reflux', description: 'ارتجاع مريء وحموضة حادة' },
          { label: 'مغص وتقلصات معوية مع غازات وانتفاخ', value: 'colic_spasm', description: 'تشنجات عضلات القولون والجهاز الهضمي' },
          { label: 'ألم حارق شديد في أعلى البطن يزداد عند الجوع مع غثيان', value: 'ulcer_pain', description: 'اشتباه قرحة أو التهاب بطانة المعدة الحاد' }
        ]
      });
    }

    baseQuestions.push({
      id: 'symptom_duration',
      text: 'منذ متى بدأت هذه الأعراض؟',
      options: [
        { label: 'منذ اليوم أو أمس (1 - 2 يوم)', value: '1_2_days', description: 'مرحلة البداية الحادة - استجابة ممتازة للعلاج التحفظي' },
        { label: 'منذ 3 إلى 5 أيام', value: '3_5_days', description: 'ذروة الأعراض الفيروسية/الموسمية' },
        { label: 'أكثر من 10 أيام أو تزداد سوءاً بشكل ملحوظ', value: 'more_10_days', description: 'تستدعي الفحص السريري المخبري لاستبعاد المضاعفات البكتيرية', isHighRisk: true }
      ]
    });

    return baseQuestions;
  }

  // Generate automated clinical assessment & pharmacy prescription
  public static evaluateClinicalCase(
    conditionId: string,
    answers: Record<string, string>
  ): TriageAssessmentResult {
    const patientProfile = answers['patient_profile'] || 'adult_healthy';
    const chronicDisease = answers['chronic_diseases'] || 'none';
    const symptomNature = answers['symptom_nature'] || answers['cough_type'] || answers['gastric_nature'] || 'general';
    const duration = answers['symptom_duration'] || '1_2_days';

    const isHighBloodPressure = chronicDisease === 'hypertension';
    const isUlcer = chronicDisease === 'ulcer';
    const isAsthma = chronicDisease === 'asthma';
    const isChild = patientProfile === 'child';
    const isInfant = patientProfile === 'infant';
    const isPregnant = patientProfile === 'pregnant';
    const isLactating = patientProfile === 'lactating';
    const isLongDuration = duration === 'more_10_days';

    // Red flags check
    const redFlags: string[] = [];
    if (isInfant) redFlags.push('المريض رضيع أقل من سنتين: يجب التوجيه الفوري لعيادة الأطفال وتجنب أدوية البالغين.');
    if (isLongDuration) redFlags.push('استمرار الأعراض لأكثر من 10 أيام يستوجب فحص طبيب لاستبعاد العدوى البكتيرية الثانوية.');
    if (symptomNature === 'high_fever_sorethroat') redFlags.push('الحرارة المرتفعة جداً (>38.5) مع صعوبة البلع الشديدة قد تتطلب مسحة أو مضاد حيوي بعد تقييم الطبيب.');
    if (symptomNature === 'wheezing_dyspnea') redFlags.push('وجود تزييق وضيق تنفس حاد يتطلب جلسات استنشاق موسع شعب هوائية (Nebulizer) وفحص الصدر.');

    const contraindications: string[] = [];
    const safeMedications: RecommendedDrug[] = [];
    const nonPharmAdvice: string[] = [];

    // Detailed Clinical Logic by Condition:
    if (conditionId === 'cold_flu') {
      if (isHighBloodPressure) {
        contraindications.push('⛔ تحذير حرج: ممنوع تماماً صرف أدوية البرد المركبة مثل (Congestal, Cold-Free, Flumox, Comtrex, 123) لاحتوائها على Pseudoephedrine أو Phenylephrine التي تسبب انقباض الأوعية وارتفاعاً خطيراً ومفاجئاً في ضغط الدم.');
        safeMedications.push({
          id: 'panadol_blue',
          name: 'بانادول أزرق 500 مجم (Panadol Blue)',
          genericName: 'Paracetamol 500mg',
          category: 'مسكن وخافض حرارة آمن لمرضى الضغط',
          unitPrice: 28.0,
          dosage: 'قرص إلى قرصين كل 6-8 ساعات بعد الأكل (الحد الأقصى 8 أقراص يومياً)',
          timing: 'كل 8 ساعات',
          duration: '3 - 5 أيام',
          shelfLocation: 'رف A-02 / المسكنات',
          barcode: '6221145001234',
          safetyReason: 'باراسيتامول نقي آمن تماماً للضغط بدون أي مواد قابضة للأوعية'
        });
        safeMedications.push({
          id: 'telfast_120',
          name: 'تلفاست 120 مجم أقراص (Telfast 120mg)',
          genericName: 'Fexofenadine 120mg',
          category: 'مضاد هيستامين للرشح والعطس',
          unitPrice: 75.0,
          dosage: 'قرص واحد يومياً قبل النوم أو صباحاً',
          timing: 'مرة يومياً',
          duration: '5 أيام',
          shelfLocation: 'رف B-04 / الحساسية والأنف',
          barcode: '6221145005541',
          safetyReason: 'مضاد هيستامين من الجيل الثاني آمن للضغط ولا يسبب نعاساً شديداً'
        });
        safeMedications.push({
          id: 'physiomer_spray',
          name: 'بخاخ ماء البحر فزيومير / سينومارين (Seawater Nasal Spray)',
          genericName: 'Hypertonic Seawater Solution',
          category: 'بخاخ أنف طبيعي 100% لإزالة الاحتقان',
          unitPrice: 95.0,
          dosage: 'بخة في كل فتحة أنف 3 إلى 4 مرات يومياً',
          timing: 'عند اللزوم',
          duration: 'حسب الحاجة',
          shelfLocation: 'رف C-01 / بخاخات الأنف',
          barcode: '6221145009876',
          safetyReason: 'بديل طبيعي آمن لمزيلات الاحتقان الكيميائية التي ترفع الضغط'
        });
        safeMedications.push({
          id: 'strepsils_honey',
          name: 'أقراص استحلاب ستربسلز عسل وليمون (Strepsils)',
          genericName: 'Dichlorobenzyl alcohol + Amylmetacresol',
          category: 'ملطف ومطهر للحلق ومسكن للالتهاب',
          unitPrice: 45.0,
          dosage: 'قرص استحلاب بالفم كل 3 إلى 4 ساعات',
          timing: 'عند اللزوم',
          duration: '3 - 5 أيام',
          shelfLocation: 'رف A-05 / الاستحلاب',
          barcode: '6221145003322',
          safetyReason: 'تلطيف الغشاء المخاطي للحلق بدون أي تأثير على ضغط الدم'
        });
      } else if (isPregnant) {
        contraindications.push('⛔ تحذير الحمل: يمنع صرف مضادات الالتهاب غير الستيرويدية (Ibuprofen / Voltaren) وأدوية الاحتقان المركبة ومضادات الهيستامين غير المعتمدة للحوامل.');
        safeMedications.push({
          id: 'panadol_pure',
          name: 'باراسيتامول أقراص 500 مجم (Paracetamol Pure)',
          genericName: 'Paracetamol 500mg (Category B Safe in Pregnancy)',
          category: 'خافض حرارة ومسكن آمن للحمل',
          unitPrice: 20.0,
          dosage: 'قرص واحد عند اللزوم بعد الأكل (بحد أقصى 3 أقراص باليوم)',
          timing: 'كل 8 ساعات عند اللزوم',
          duration: 'أقصر فترة ممكنة',
          shelfLocation: 'رف A-01 / المسكنات الآمنة',
          barcode: '6221145001111',
          safetyReason: 'العقار الأكثر أماناً وموصى به في إرشادات الحمل العالمية'
        });
        safeMedications.push({
          id: 'saline_drops',
          name: 'قطرة محلول ملحي للأنف سالينكس / أوتريفين بيبي سالين',
          genericName: 'Sodium Chloride 0.9% Nasal Drops',
          category: 'تنظيف وترطيب الأنف',
          unitPrice: 18.0,
          dosage: 'نقطتان في كل فتحة أنف 3 مرات يومياً',
          timing: '3 مرات يومياً',
          duration: '5 - 7 أيام',
          shelfLocation: 'رف C-02 / رعاية الأم والطفل',
          barcode: '6221145002233',
          safetyReason: 'محلول ملحي معقم بدون أي إضافات كيميائية أو مواد قابضة'
        });
      } else if (isChild) {
        contraindications.push('⛔ تحذير للأطفال: ممنوع الأسبرين كلياً (لتفادي متلازمة راي Reye\'s Syndrome)، وتجنب شراب الكحة المحتوي على كودايين أو مضادات احتقان لمن هم دون 6 سنوات.');
        safeMedications.push({
          id: 'cetal_syrup',
          name: 'سيتال شراب للأطفال 250 مجم / 5 مل (Cetal Syrup)',
          genericName: 'Paracetamol Syrup',
          category: 'مسكن وخافض حرارة للأطفال',
          unitPrice: 22.0,
          dosage: 'جرعة محسوبة حسب وزن الطفل (15 مجم/كجم) كل 6-8 ساعات',
          timing: 'كل 6-8 ساعات',
          duration: '3 أيام',
          shelfLocation: 'رف D-01 / أدوية الأطفال',
          barcode: '6221145007788',
          safetyReason: 'خافض حرارة قياسي آمن للمعدة وللأطفال'
        });
        safeMedications.push({
          id: 'claritin_syrup',
          name: 'كلاريتين شراب للأطفال (Claritin Syrup 5mg/5ml)',
          genericName: 'Loratadine Syrup',
          category: 'مضاد هيستامين للأطفال',
          unitPrice: 38.0,
          dosage: '5 مل ملعقة صغيرة مرة واحدة يومياً قبل النوم',
          timing: 'مرة يومياً مساءً',
          duration: '5 أيام',
          shelfLocation: 'رف D-02 / شراب الحساسية',
          barcode: '6221145009900',
          safetyReason: 'آمن وفعال لتخفيف الرشح والعطس للأطفال'
        });
      } else {
        // Healthy Adult standard cold protocol
        safeMedications.push({
          id: 'congestal_tab',
          name: 'كونجستال أقراص نزلات البرد (Congestal Tablets)',
          genericName: 'Paracetamol + Pseudoephedrine + Chlorpheniramine',
          category: 'علاج شامل لنزلات البرد والرشح والصداع',
          unitPrice: 35.0,
          dosage: 'قرص واحد كل 8 ساعات بعد الأكل',
          timing: 'كل 8 ساعات',
          duration: '3 - 5 أيام',
          shelfLocation: 'رف A-03 / أدوية البرد والإنفلونزا',
          barcode: '6221145004455',
          safetyReason: 'تركيبة ثلاثية المفعول تزيل الاحتقان وتسكن تكسير العظام'
        });
        safeMedications.push({
          id: 'vit_c_zinc',
          name: 'فيتامين سي فوار + زنك 1000 مجم (C-Retard / Redoxon)',
          genericName: 'Ascorbic Acid 1000mg + Zinc',
          category: 'دعم المناعة ومضاد أكسدة',
          unitPrice: 32.0,
          dosage: 'قرص فوار يذاب في نصف كوب ماء بعد الإفطار مرة يومياً',
          timing: 'مرة يومياً صباحاً',
          duration: '7 أيام',
          shelfLocation: 'رف E-01 / الفيتامينات والمناعة',
          barcode: '6221145006677',
          safetyReason: 'تسريع التعافي وتقليل مدة نزلة البرد'
        });
      }

      nonPharmAdvice.push('تناول السوائل الدافئة بوفرة (يانسون، ليمون دافئ، زنجبيل مع عسل).');
      nonPharmAdvice.push('الراحة التامة وتجنب التعرض لتيارات الهواء الباردة أو المكيفات المباشرة.');
      nonPharmAdvice.push('استنشاق بخار الماء الدافئ لترطيب الجيوب الأنفية وتسهيل التنفس.');
    } else if (conditionId === 'cough_wet_dry') {
      const isDry = symptomNature === 'dry_cough';

      if (isDry) {
        safeMedications.push({
          id: 'notussil_syrup',
          name: 'نوتوسيل شراب للكحة الجافة (Notussil Syrup)',
          genericName: 'Cloperastine Fendizoate',
          category: 'مهدئ كحة جافة وموسع للشعب الهوائية',
          unitPrice: 38.0,
          dosage: '10 مل (ملعقة كبيرة) 3 مرات يومياً بعد الأكل',
          timing: 'كل 8 ساعات',
          duration: '5 أيام',
          shelfLocation: 'رف B-01 / أدوية الكحة',
          barcode: '6221145001290',
          safetyReason: 'يعمل على تهدئة مركز السعال بدون إحداث خمول حاد أو إدمان'
        });
        safeMedications.push({
          id: 'bronchicum_elixir',
          name: 'برونشيكم إكسير أعشاب طبيعية (Bronchicum Elixir)',
          genericName: 'Thyme + Primula Root Extracts',
          category: 'مستخلص الزعتر الطبيعي لتهدئة الشعب',
          unitPrice: 55.0,
          dosage: 'ملعقة كبيرة 3 مرات يومياً',
          timing: 'كل 8 ساعات',
          duration: '5 - 7 أيام',
          shelfLocation: 'رف B-03 / المستحضرات العشبية',
          barcode: '6221145001300',
          safetyReason: 'مستخلصات نباتية طبيعية ملطفة للغشاء التنفسي'
        });
      } else {
        // Productive wet cough
        safeMedications.push({
          id: 'acetylcysteine_600',
          name: 'أسيتيل سيستايين أكياس فوارة 600 مجم (Acetylcysteine Eff)',
          genericName: 'N-Acetylcysteine 600mg',
          category: 'مذيب قوي للبلغم ومضاد للأكسدة',
          unitPrice: 42.0,
          dosage: 'كيس فوار يذاب في نصف كوب ماء مرتين يومياً بعد الأكل',
          timing: 'كل 12 ساعة',
          duration: '5 - 7 أيام',
          shelfLocation: 'رف B-02 / مذيبات البلغم',
          barcode: '6221145001310',
          safetyReason: 'يكسر الروابط الكيميائية للمخاط اللزج ويسهل طرده طبيعياً'
        });
        safeMedications.push({
          id: 'mucosolvan_syrup',
          name: 'ميكوسولفان شراب 30 مجم / 5 مل (Mucosolvan Syrup)',
          genericName: 'Ambroxol Hydrochloride',
          category: 'مذيب وطارد للبلغم ومحسن لإفراز السورفاكتانت',
          unitPrice: 35.0,
          dosage: '10 مل 3 مرات يومياً بعد الوجبات',
          timing: 'كل 8 ساعات',
          duration: '5 أيام',
          shelfLocation: 'رف B-01 / أدوية الكحة والبلغم',
          barcode: '6221145001320',
          safetyReason: 'يحسن حركة الأهداب التنفسية لطرد البلغم بدون تثبيط السعال'
        });
      }

      nonPharmAdvice.push('شرب ما لا يقل عن 2.5 إلى 3 لترات ماء وسوائل دافئة يومياً لتسييل البلغم.');
      nonPharmAdvice.push('ملعقة عسل نحل طبيعي مع ماء دافئ صباحاً ومساءً لترطيب الحلق.');
      nonPharmAdvice.push('تجنب التدخين السلبي والروائح النفاذة والغبار والأتربة تماماً.');
    } else {
      // General Gastro / Headache default
      safeMedications.push({
        id: 'panadol_extra',
        name: 'بانادول إكسترا أقراص (Panadol Extra)',
        genericName: 'Paracetamol 500mg + Caffeine 65mg',
        category: 'مسكن قوي وسريع للصداع والآلام',
        unitPrice: 34.0,
        dosage: 'قرص إلى قرصين عند اللزوم (تجنب تناوله قبل النوم لاحتوائه على كافيين)',
        timing: 'عند اللزوم كل 8 ساعات',
        duration: '3 أيام',
        shelfLocation: 'رف A-01 / المسكنات',
        barcode: '6221145001330',
        safetyReason: 'تركيبة معززة بالكافيين لسرعة امتصاص الباراسيتامول وإزالة الصداع'
      });
      safeMedications.push({
        id: 'gaviscon_syrup',
        name: 'جافيسكون شراب أكياس للحموضة (Gaviscon Advance)',
        genericName: 'Sodium Alginate + Potassium Bicarbonate',
        category: 'حاجز رغوي مانع لارتجاع حمض المعدة',
        unitPrice: 50.0,
        dosage: 'كيس واحد بعد الوجبات الرئيسية وقبل النوم مباشرة',
        timing: 'بعد الأكل وعند النوم',
        duration: 'عند اللزوم',
        shelfLocation: 'رف C-04 / الجهاز الهضمي والحموضة',
        barcode: '6221145001340',
        safetyReason: 'يشكل طبقة حماية فورية فوق عصارة المعدة تمنع صعود الحمض للمريء'
      });
      nonPharmAdvice.push('تجنب الأطعمة الدسمة والمقليات والبهارات الحارة والشوكولاتة والقهوة.');
      nonPharmAdvice.push('عدم الاستلقاء أو النوم مباشرة بعد تناول الطعام (الانتظار ساعتين على الأقل).');
    }

    let conditionTitle = 'استشارة صيدلانية سريرية';
    const foundCond = this.availableConditions.find(c => c.id === conditionId);
    if (foundCond) conditionTitle = foundCond.name;

    const patientSummary = `المريض: ${patientProfile === 'adult_healthy' ? 'بالغ' : patientProfile === 'child' ? 'طفل' : patientProfile === 'pregnant' ? 'حامل' : patientProfile === 'elderly' ? 'مسن' : 'خاص'} | الأمراض المزمنة: ${chronicDisease === 'hypertension' ? 'ارتفاع ضغط دم ⚠️' : chronicDisease === 'ulcer' ? 'قرحة معدة ⚠️' : chronicDisease === 'asthma' ? 'ربو وحساسية صدر ⚠️' : 'لا يوجد'} | مدة الحالة: ${duration === '1_2_days' ? 'يوم إلى يومين' : duration === '3_5_days' ? '3 إلى 5 أيام' : 'أكثر من 10 أيام'}`;

    const clinicalDiagnosis = `تشخيص الحالة: ${conditionTitle} (${isHighBloodPressure ? 'مع مراعاة بروتوكول مرضى الضغط الخاص' : isPregnant ? 'مع مراعاة معايير السلامة للحوامل' : isChild ? 'مع مراعاة جرعات الأطفال الآمنة' : 'بروتوكول علاجي قياسي OTC'}). تم استبعاد المواد الفعالة المتعارضة وضمان توافر الأدوية المرشحة بمخزون الصيدلية.`;

    const severityLevel = isInfant || isLongDuration || symptomNature === 'high_fever_sorethroat' 
      ? 'HIGH_DOCTOR_REFERRAL' 
      : (isHighBloodPressure || isPregnant || isChild ? 'MODERATE_MONITORED' : 'MILD_OTC');

    return {
      conditionTitle,
      patientSummary,
      clinicalDiagnosis,
      severityLevel,
      contraindications,
      safeMedications,
      nonPharmAdvice,
      redFlags
    };
  }
}
