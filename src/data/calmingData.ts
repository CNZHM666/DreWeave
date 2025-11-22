// 治愈系文案数据
export const calmingMessages = [
  {
    id: 1,
    message: "深呼吸，让心情像云朵一样轻盈 🌤️",
    breathing: "吸气4秒，屏住2秒，呼气6秒",
    category: "calm"
  },
  {
    id: 2,
    message: "每一次冲动都是成长的机会，你正在变得更强大 💪",
    breathing: "慢慢吸气，感受空气填满肺部",
    category: "encourage"
  },
  {
    id: 3,
    message: "想象自己站在山顶，所有的烦恼都在脚下 ⛰️",
    breathing: "深呼吸，想象压力随呼气离开",
    category: "imagine"
  },
  {
    id: 4,
    message: "你比想象中更坚强，这一时刻也会过去 🌈",
    breathing: "4-7-8呼吸法：吸气4秒，屏息7秒，呼气8秒",
    category: "encourage"
  },
  {
    id: 5,
    message: "让心静下来，像湖面一样平静 🌊",
    breathing: "腹式呼吸：手放腹部，感受起伏",
    category: "calm"
  },
  {
    id: 6,
    message: "你已经走了这么远，不要放弃现在的努力 🚶‍♀️",
    breathing: "均匀呼吸，保持自然节奏",
    category: "motivate"
  },
  {
    id: 7,
    message: "这一刻的冲动只是暂时的，理性会指引你 🧭",
    breathing: "深呼吸，给大脑更多氧气",
    category: "rational"
  },
  {
    id: 8,
    message: "像大树一样扎根，任风吹雨打也不动摇 🌳",
    breathing: "想象自己是一棵大树，深深扎根",
    category: "imagine"
  },
  {
    id: 9,
    message: "你的意志力比冲动更强大，相信自己 💫",
    breathing: "缓慢深呼吸，增强意志力",
    category: "encourage"
  },
  {
    id: 10,
    message: "让正能量充满全身，驱散负面情绪 ✨",
    breathing: "想象正能量随吸气进入体内",
    category: "positive"
  },
  {
    id: 11,
    message: "每一次自制都是对自己的投资，未来会感谢现在 📈",
    breathing: "深呼吸，为大脑充电",
    category: "motivate"
  },
  {
    id: 12,
    message: "心静自然凉，保持内心的平静 🧘‍♀️",
    breathing: "冥想呼吸，专注当下",
    category: "calm"
  },
  {
    id: 13,
    message: "你是自己人生的主人，不是冲动的奴隶 👑",
    breathing: "深呼吸，夺回控制权",
    category: "empower"
  },
  {
    id: 14,
    message: "像鹰一样高飞，俯瞰现在的困扰 🦅",
    breathing: "想象自己翱翔在天空",
    category: "imagine"
  },
  {
    id: 15,
    message: "内心的平静是最强大的力量 🏔️",
    breathing: "深呼吸，找到内心的平静",
    category: "strength"
  }
]

// 呼吸引导动画数据
export const breathingAnimations = [
  {
    id: 1,
    name: "基础深呼吸",
    description: "简单有效的放松呼吸法",
    phases: [
      { name: "吸气", duration: 4000, color: "#3B82F6" },
      { name: "屏息", duration: 2000, color: "#8B5CF6" },
      { name: "呼气", duration: 6000, color: "#10B981" }
    ]
  },
  {
    id: 2,
    name: "4-7-8呼吸法",
    description: "快速缓解焦虑的专业呼吸法",
    phases: [
      { name: "吸气", duration: 4000, color: "#3B82F6" },
      { name: "屏息", duration: 7000, color: "#8B5CF6" },
      { name: "呼气", duration: 8000, color: "#10B981" }
    ]
  },
  {
    id: 3,
    name: "腹式呼吸",
    description: "深度放松的腹部呼吸法",
    phases: [
      { name: "吸气", duration: 6000, color: "#3B82F6" },
      { name: "屏息", duration: 2000, color: "#8B5CF6" },
      { name: "呼气", duration: 8000, color: "#10B981" }
    ]
  }
]

// 音乐推荐数据
export const musicRecommendations = [
  {
    id: 1,
    title: "森林晨曲",
    description: "大自然的治愈之声",
    type: "nature",
    duration: "15分钟",
    mood: "calm"
  },
  {
    id: 2,
    title: "海浪轻语",
    description: "海边放松音乐",
    type: "nature",
    duration: "20分钟",
    mood: "relax"
  },
  {
    id: 3,
    title: "禅意冥想",
    description: "深度冥想音乐",
    type: "meditation",
    duration: "30分钟",
    mood: "meditate"
  },
  {
    id: 4,
    title: "雨后彩虹",
    description: "清新治愈音乐",
    type: "healing",
    duration: "25分钟",
    mood: "heal"
  },
  {
    id: 5,
    title: "星空漫步",
    description: "夜晚宁静音乐",
    type: "ambient",
    duration: "40分钟",
    mood: "peace"
  }
]