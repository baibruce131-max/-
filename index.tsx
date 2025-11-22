import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Clipboard, FileText, Calendar, Printer, Upload, Loader2, RefreshCw, Image as ImageIcon, MessageSquare, Send, FileType, Settings, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Type, Schema } from "@google/genai";

// --- Types ---

interface WeeklyInfo {
  dateRange: string;
  theme: string;
  classStr: string;
  teachers: string;
}

interface DailyPlan {
  day: string;
  date: string;
  morningExercise: {
    activity: string;
    observation: string;
    reflection: string;
  };
  areaPlay: {
    activity: string;
    observation: string;
    reflection: string;
  };
  collectiveActivity: {
    title: string;
    goals: string[];
    prep: string;
    process: string;
    reflection: string;
  };
  gameActivity: {
    title: string;
    content: string;
    observation: string;
    reflection: string;
  };
  lifeActivity: {
    content: string;
    observation: string;
    reflection: string;
  };
  outdoorActivity: {
    title: string;
    content: string;
    observation: string;
    reflection: string;
  };
  dismissal: {
    content: string;
    observation: string;
    reflection: string;
  };
}

interface WeeklyData {
  weeklyInfo: WeeklyInfo;
  dailyPlans: DailyPlan[];
}

interface UploadedFile {
  data: string; // base64 string
  mimeType: string;
  name: string;
}

// --- Constants & Defaults ---

const DEFAULT_INITIAL_REQUIREMENTS = `1. **核心线索**：以文件内容为主。
2. **体锻活动（7:45-8:40）**：
   - 内容限定：参考文件内的体育活动。
   - 重点：围绕动作技能发展（平衡、核心力量）、坚持性、创意组合和规则意识。
3. **区域游戏（08:40-09:50）**：
   - 每天必须列出**至少两个**具体的区域（如美工区、科学区、建构区、语言区等）。
   - 活动内容要结合主题。
4. **生活活动（11:10-14:40）**：
   - 必须包含四个完整环节且**不能缩写**：**午餐活动、如厕/盥洗、散步活动、午睡活动**。
   - 内容要具体、细致，体现常规培养。
5. **反思（重点）**：
   - 格式必须包含：★ 亮点（含百分比数据）、▲ 不足之处（含具体现象）、◎ 改进措施（具体策略）。
   - **强制换行**：★、▲、◎ 每一条写完后必须换行，确保视觉上分行显示。
   - 内容需详实深刻，字数要求300字左右。
6. **集体活动**：根据文件中的教学计划，包含名称、目标（3条）、准备、过程、反思。
7. **游戏活动**：根据文档内容。
8. **格式要求（全局强制）**：
   - **分条列述**：所有“活动安排”和“观察要点”必须使用序号（1. 2. 3.）分条列述。
   - **强制换行**：每一条序号内容结束后必须换行。
   - **内容精简**：“活动安排”请简略描写，指出活动名称和大致内容即可，避免冗长描述。`;

const INITIAL_DATA: WeeklyData = {
  weeklyInfo: {
    dateRange: "2025.10.13 - 2025.10.17",
    theme: "《美味秋天》",
    classStr: "中（2）班",
    teachers: "丁瑶薇、刘舸"
  },
  dailyPlans: [
    {
      day: "周一",
      date: "2025.10.13",
      morningExercise: {
        activity: "1. 自主签到：选择运动手环。\n2. 体锻活动（安吉梯组合）：尝试合作搭建，在不同坡度梯面上行走。\n3. 放松活动：互相拍打肌肉。",
        observation: "1. 观察搭建稳固性。\n2. 观察走独木桥时的平衡注视。\n3. 观察克服恐惧的情况。",
        reflection: "★85%幼儿平衡能力良好，能发现固定梯子的方法。\n▲约15%女生不敢尝试高梯。\n◎明设“分级挑战区”，从低难度引导自信。"
      },
      areaPlay: {
        activity: "1. 美工区：树叶拼贴画，创意拼贴。\n2. 建构区：搭建秋天公园，围合围墙。\n3. 重点指导：利用自然纹理创作。",
        observation: "1. 能否根据形状联想布局。\n2. 围合技能的运用。\n3. 保持安静专注。",
        reflection: "★90%幼儿独立完成拼贴，构思独特。\n▲建构区出现争抢积木。\n◎增加材料规则或引导合作共享。"
      },
      collectiveActivity: {
        title: "科学活动《秋叶变变变》",
        goals: [
          "1. 观察秋天树叶的颜色变化，了解叶子变黄/红的原因。",
          "2. 能够按颜色、形状对树叶进行分类。",
          "3. 感受秋天大自然的色彩美。"
        ],
        prep: "各种颜色的落叶实物、PPT课件、分类筐。",
        process: "1. 出示落叶，提问颜色差异。\n2. 观看视频，了解变色秘密。\n3. 游戏：树叶找家分类。\n4. 总结：秋天的多彩变化。",
        reflection: "★95%幼儿区分颜色，对原理好奇。\n▲20%幼儿对“叶绿素”词汇理解困难。\n◎语言童趣化，用比喻或实验辅助说明。"
      },
      gameActivity: {
        title: "角色游戏：美味秋日小铺",
        content: "1. 创设柜台，售卖树叶饼干和水果。\n2. 分配店长、收银员等角色。\n3. 鼓励使用礼貌用语。",
        observation: "1. 店员服务态度。\n2. 顾客排队支付情况。\n3. 商品装饰创意。",
        reflection: "★角色代入感强，能说出秋季水果。\n▲收银换算不熟练。\n◎投放简易价格表降低难度。"
      },
      lifeActivity: {
        content: "1. 午餐活动：介绍南瓜营养，鼓励不挑食。\n2. 如厕/盥洗：排队不推挤，七步洗手法。\n3. 散步活动：寻找不同颜色落叶。\n4. 午睡活动：折叠衣物，安静入睡。",
        observation: "1. 尝试秋季蔬菜情况。\n2. 洗手规范度。\n3. 自我服务能力。",
        reflection: "★98%幼儿喝光南瓜汤，桌面整洁。\n▲散步过于兴奋跑跳。\n◎明确慢走规则，增加观察任务。"
      },
      outdoorActivity: {
        title: "体育游戏：秋风扫落叶",
        content: "1. 教师扮风，幼儿扮落叶。\n2. 根据风力变化调整动作。\n3. 增加方向指令难度。",
        observation: "1. 反应速度与动作调整。\n2. 躲避障碍物能力。\n3. 静止时的平衡控制。",
        reflection: "★100%沉浸情境，反应迅速。\n▲个别奔跑过快易摔倒。\n◎增加肢体动作丰富情节并降低速度。"
      },
      dismissal: {
        content: "1. 整理衣物书包。\n2. 一日小结与表扬。\n3. 布置亲子树叶书签任务。",
        observation: "1. 整理物品独立性。\n2. 复述任务能力。\n3. 离园秩序。",
        reflection: "★大部分幼儿整理有序。\n◎家长群同步通知任务。"
      }
    }
  ]
};

// --- Helpers ---

// Robust API Key Retrieval
const getApiKey = () => {
  let key = "";
  
  // 1. Try Vite environment variables (Preferred for Netlify/Vite)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.VITE_GEMINI_API_KEY) key = import.meta.env.VITE_GEMINI_API_KEY;
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) key = import.meta.env.VITE_API_KEY;
      // @ts-ignore
      if (import.meta.env.GEMINI_API_KEY) key = import.meta.env.GEMINI_API_KEY; // Less likely to work
    }
  } catch (e) {}

  if (key) return key;

  // 2. Try standard Process environment variables (Create React App / Webpack)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.REACT_APP_GEMINI_API_KEY) key = process.env.REACT_APP_GEMINI_API_KEY;
      if (process.env.REACT_APP_API_KEY) key = process.env.REACT_APP_API_KEY;
      if (process.env.GEMINI_API_KEY) key = process.env.GEMINI_API_KEY;
      if (process.env.API_KEY) key = process.env.API_KEY;
    }
  } catch (e) {}

  return key;
};

// --- Components ---

const DailyPlanTable = ({ plan, weeklyInfo }: { plan: DailyPlan; weeklyInfo: WeeklyInfo }) => {
  return (
    <div style={{ fontFamily: '"SimSun", "Songti SC", serif', width: '100%', boxSizing: 'border-box' }}>
      {/* Header Section */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0px', border: '1px solid black' }}>
        <tbody>
          <tr>
            <th colSpan={4} style={{ padding: '12px', fontSize: '24px', fontWeight: 'bold', border: '1px solid black', textAlign: 'center', backgroundColor: '#fff' }}>
              一日活动计划
            </th>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid black', width: '15%', textAlign: 'center', fontWeight: 'bold' }}>时间</td>
            <td style={{ padding: '8px', border: '1px solid black', width: '35%', textAlign: 'center' }}>{plan.date}</td>
            <td style={{ padding: '8px', border: '1px solid black', width: '15%', textAlign: 'center', fontWeight: 'bold' }}>班级</td>
            <td style={{ padding: '8px', border: '1px solid black', width: '35%', textAlign: 'center' }}>{weeklyInfo.classStr}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>主题</td>
            <td style={{ padding: '8px', border: '1px solid black', textAlign: 'center' }}>{weeklyInfo.theme}</td>
            <td style={{ padding: '8px', border: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>教师</td>
            <td style={{ padding: '8px', border: '1px solid black', textAlign: 'center' }}>{weeklyInfo.teachers}</td>
          </tr>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <td style={{ padding: '8px', border: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>时间与主要环节</td>
            <td style={{ padding: '8px', border: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>活动安排</td>
            <td style={{ padding: '8px', border: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>观察要点</td>
            <td style={{ padding: '8px', border: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>
              反思<br />
              <span style={{ fontSize: '12px', fontWeight: 'normal' }}>（★亮点▲不足之处◎改进措施）</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Content Section */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', border: '1px solid black' }}>
        <tbody>
          {/* 7:45-8:40 Morning Exercise */}
          <tr>
            <td style={{ padding: '15px', border: '1px solid black', width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>
              7:45-8:40<br />体锻活动
            </td>
            <td style={{ padding: '10px', border: '1px solid black', width: '35%', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.morningExercise.activity}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', width: '25%', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.morningExercise.observation}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', width: '25%', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.morningExercise.reflection}
            </td>
          </tr>

          {/* 08:40-09:50 Area Play */}
          <tr>
            <td style={{ padding: '15px', border: '1px solid black', textAlign: 'center', verticalAlign: 'middle' }}>
              08:40-09:50<br />区域游戏<br />（融自主点心）
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.areaPlay.activity}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.areaPlay.observation}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.areaPlay.reflection}
            </td>
          </tr>

          {/* 9:50-10:20 Collective Activity */}
          <tr>
            <td style={{ padding: '15px', border: '1px solid black', textAlign: 'center', verticalAlign: 'middle' }}>
              集体活动<br />9:50-10:20
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top' }}>
              <strong>{plan.collectiveActivity.title}</strong><br /><br />
              <strong>活动目标：</strong><br />
              {plan.collectiveActivity.goals.map((g, i) => <div key={i}>{g}</div>)}<br />
              <strong>活动准备：</strong><br />
              {plan.collectiveActivity.prep}<br /><br />
              <strong>活动过程：</strong><br />
              <div style={{ whiteSpace: 'pre-line' }}>{plan.collectiveActivity.process}</div>
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', fontStyle: 'italic' }}>
              重点观察幼儿在集体活动中的互动与专注度。
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.collectiveActivity.reflection}
            </td>
          </tr>

          {/* 10:20-11:10 Game Activity */}
          <tr>
            <td style={{ padding: '15px', border: '1px solid black', textAlign: 'center', verticalAlign: 'middle' }}>
              游戏活动<br />10:20-11:10
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              <strong>{plan.gameActivity.title}</strong><br />
              {plan.gameActivity.content}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.gameActivity.observation}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.gameActivity.reflection}
            </td>
          </tr>

          {/* 11:10-14:40 Life Activity */}
          <tr>
            <td style={{ padding: '15px', border: '1px solid black', textAlign: 'center', verticalAlign: 'middle' }}>
              生活活动<br />11:10-14:40
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.lifeActivity.content}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.lifeActivity.observation}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.lifeActivity.reflection}
            </td>
          </tr>

          {/* 14:40-16:00 Outdoor Activity */}
          <tr>
            <td style={{ padding: '15px', border: '1px solid black', textAlign: 'center', verticalAlign: 'middle' }}>
              游戏活动<br />14:40-16:00
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              <strong>{plan.outdoorActivity.title}</strong><br />
              {plan.outdoorActivity.content}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.outdoorActivity.observation}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.outdoorActivity.reflection}
            </td>
          </tr>

           {/* 16:00-16:10 Dismissal */}
           <tr>
            <td style={{ padding: '15px', border: '1px solid black', textAlign: 'center', verticalAlign: 'middle' }}>
              离园活动<br />16:00-16:10
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.dismissal.content}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.dismissal.observation}
            </td>
            <td style={{ padding: '10px', border: '1px solid black', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
              {plan.dismissal.reflection}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyData>(INITIAL_DATA);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Configuration States
  const [initialRequirements, setInitialRequirements] = useState(DEFAULT_INITIAL_REQUIREMENTS);
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [showConfig, setShowConfig] = useState(true);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modifyInputRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    if (tableRef.current) {
      const range = document.createRange();
      range.selectNode(tableRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();
      alert('表格已复制！请直接粘贴到 Word 文档中。');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Size check: 10MB Limit
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`文件过大 (${(file.size / 1024 / 1024).toFixed(2)}MB)。请上传小于 10MB 的图片或PDF。`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        setUploadError('请上传图片(.jpg, .png) 或 PDF文件');
        return;
      }
      setUploadError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1]; // Extract raw base64
        setUploadedFile({
            data: base64Data,
            mimeType: file.type,
            name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getCommonSchema = () => {
     return {
        type: Type.OBJECT,
        properties: {
            weeklyInfo: {
                type: Type.OBJECT,
                properties: {
                    dateRange: { type: Type.STRING },
                    theme: { type: Type.STRING },
                    classStr: { type: Type.STRING },
                    teachers: { type: Type.STRING },
                },
                required: ["dateRange", "theme", "classStr", "teachers"]
            },
            dailyPlans: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING },
                        date: { type: Type.STRING },
                        morningExercise: {
                            type: Type.OBJECT,
                            properties: {
                                activity: { type: Type.STRING },
                                observation: { type: Type.STRING },
                                reflection: { type: Type.STRING }
                            },
                            required: ["activity", "observation", "reflection"]
                        },
                        areaPlay: {
                            type: Type.OBJECT,
                            properties: {
                                activity: { type: Type.STRING },
                                observation: { type: Type.STRING },
                                reflection: { type: Type.STRING }
                            },
                            required: ["activity", "observation", "reflection"]
                        },
                        collectiveActivity: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                                prep: { type: Type.STRING },
                                process: { type: Type.STRING },
                                reflection: { type: Type.STRING }
                            },
                             required: ["title", "goals", "prep", "process", "reflection"]
                        },
                         gameActivity: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: { type: Type.STRING },
                                observation: { type: Type.STRING },
                                reflection: { type: Type.STRING }
                            },
                             required: ["title", "content", "observation", "reflection"]
                        },
                         lifeActivity: {
                            type: Type.OBJECT,
                            properties: {
                                content: { type: Type.STRING },
                                observation: { type: Type.STRING },
                                reflection: { type: Type.STRING }
                            },
                             required: ["content", "observation", "reflection"]
                        },
                        outdoorActivity: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: { type: Type.STRING },
                                observation: { type: Type.STRING },
                                reflection: { type: Type.STRING }
                            },
                             required: ["title", "content", "observation", "reflection"]
                        },
                         dismissal: {
                            type: Type.OBJECT,
                            properties: {
                                content: { type: Type.STRING },
                                observation: { type: Type.STRING },
                                reflection: { type: Type.STRING }
                            },
                             required: ["content", "observation", "reflection"]
                        }
                    },
                    required: ["day", "date", "morningExercise", "areaPlay", "collectiveActivity", "gameActivity", "lifeActivity", "outdoorActivity", "dismissal"]
                }
            }
        },
        required: ["weeklyInfo", "dailyPlans"]
    };
  };

  const generatePlans = async (isModification: boolean = false) => {
    if (!uploadedFile) {
      setUploadError('请先上传周计划文件 (图片或PDF)');
      return;
    }
    
    if (isModification && !modificationPrompt.trim()) {
       alert("请输入具体的修改意见");
       return;
    }

    isModification ? setIsRefining(true) : setIsGenerating(true);
    setUploadError(null);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
         throw new Error("API Key is missing. Check settings.");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });

      let prompt = "";
      
      // Force specific formatting rules in system prompt to ensure reliability
      const formattingInstructions = `
            **关键格式约束（必须严格执行）：**
            1. **换行规则**：在 JSON 字符串中，请使用 "\\n" 来表示换行。
            2. **列表格式**：“活动安排”和“观察要点”字段必须使用 "1. ...\\n2. ...\\n3. ..." 的格式，序号明确且换行。
            3. **反思格式**：“反思”字段必须使用 "★ ...\\n▲ ...\\n◎ ..." 的格式，确保三个部分在视觉上是分行的。
            4. **内容简洁**：“活动安排”要言简意赅，核心在于活动名称和主要内容，不要写长篇大论。
      `;

      if (isModification) {
         prompt = `
            你是一名资深的幼儿园教师。请基于提供的【周工作计划文件】和【当前的一周详细计划数据】，根据用户的【修改意见】对计划进行修正。

            **用户修改意见：**
            "${modificationPrompt}"

            **任务要求：**
            1.  保持未被修改要求的板块内容不变。
            2.  针对用户提出的意见，精准调整对应天数或板块的内容。
            3.  保持原有的专业度、反思格式（★▲◎）和详细程度。
            4.  **表头信息（主题、班级、教师）必须继续保持与文件一致。**
            
            ${formattingInstructions}

            **当前计划数据（参考用）：**
            ${JSON.stringify(weeklyData)}
         `;
      } else {
         prompt = `
            你是一名资深的幼儿园教师。请分析这个文件（图片或PDF）中的周工作计划，并将其扩写成一份非常详尽的“幼儿园中班一周（周一至周五）每日活动计划”。

            **表头信息提取：**
            请仔细识别文件中的表头信息，必须提取以下内容填入 JSON 的 \`weeklyInfo\` 中，**必须与文件完全一致**：
            1.  **时间/日期范围** (dateRange)
            2.  **班级** (classStr)
            3.  **教师** (teachers)
            4.  **主题** (theme)

            **生成规则（请严格遵守以下用户设定的初始要求）：**
            ${initialRequirements}

            ${formattingInstructions}

            **输出格式：**
            请直接返回 JSON 数据。
         `;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: prompt }, { inlineData: { data: uploadedFile.data, mimeType: uploadedFile.mimeType } }] }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: getCommonSchema() as Schema
        }
      });

      const jsonText = response.text;
      if (jsonText) {
        const resultData = JSON.parse(jsonText);
        setWeeklyData(resultData);
        // If generated successfully, ensure we select Monday
        if (!isModification) {
            setSelectedDayIndex(0);
            setShowConfig(false); // Auto-collapse config after success
        }
        if (isModification) {
            setModificationPrompt("");
            alert("计划已根据您的意见修改完毕！");
        }
      } else {
        throw new Error("No content generated. The AI response was empty.");
      }

    } catch (error: any) {
      console.error("Error generating plans:", error);
      let errorMessage = "生成出错，请重试";
      
      // Improved Error Messaging
      if (error.message && error.message.includes("API Key")) {
         errorMessage = `配置错误：未找到 API Key。如果您部署在 Netlify，请确保环境变量名为 'VITE_GEMINI_API_KEY' 或 'REACT_APP_GEMINI_API_KEY' (当前代码无法读取普通的 'GEMINI_API_KEY')。`;
      } else if (error.message) {
         errorMessage = error.message;
      }
      
      setUploadError(errorMessage);
    } finally {
      setIsGenerating(false);
      setIsRefining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
        
        {/* App Header */}
        <div className="bg-orange-100 p-6 border-b border-orange-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              幼儿园一周活动计划生成器
            </h1>
            <p className="text-orange-600 mt-1 flex flex-wrap gap-4">
              <span>主题：{weeklyData.weeklyInfo.theme}</span>
              <span>班级：{weeklyData.weeklyInfo.classStr}</span>
              <span>教师：{weeklyData.weeklyInfo.teachers}</span>
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow transition-colors font-medium"
          >
            <Clipboard className="w-4 h-4" />
            复制表格 (Word格式)
          </button>
        </div>

        {/* Upload & Configuration Section */}
        <div className="p-6 bg-gray-50 border-b space-y-6">
            <div className="max-w-3xl mx-auto">
                
                {/* Step 1: Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">步骤 1: 上传周工作计划 (图片或PDF)</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 h-32
                            ${uploadedFile ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'}`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept="image/*,application/pdf" 
                            className="hidden" 
                        />
                        {uploadedFile ? (
                             <div className="flex items-center gap-3 text-orange-700">
                                {uploadedFile.mimeType.includes('pdf') ? <FileType className="w-10 h-10"/> : <ImageIcon className="w-10 h-10" />}
                                <div className="text-left">
                                    <p className="font-bold text-sm">{uploadedFile.name}</p>
                                    <p className="text-xs opacity-70">点击更换文件</p>
                                </div>
                             </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-gray-400" />
                                <p className="text-sm text-gray-500">点击或拖拽上传 (.jpg, .png, .pdf)</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Step 2: Configuration (Collapsible) */}
                <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-bold text-gray-700"
                    >
                        <span className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            步骤 2: 设置生成规则 (初始要求)
                        </span>
                        <span className="text-xs text-gray-500">{showConfig ? '收起' : '展开编辑'}</span>
                    </button>
                    
                    {showConfig && (
                        <div className="p-4">
                            <p className="text-xs text-gray-500 mb-2">您可以编辑下方的默认要求，AI将严格按照这些规则生成计划：</p>
                            <textarea
                                value={initialRequirements}
                                onChange={(e) => setInitialRequirements(e.target.value)}
                                className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono bg-gray-50"
                                placeholder="在此输入生成规则..."
                            />
                        </div>
                    )}
                </div>

                {/* Step 3: Generate or Refine */}
                <div className="flex flex-col gap-4">
                     {/* Initial Generation Button */}
                     {(!weeklyData.dailyPlans.length || weeklyData === INITIAL_DATA) ? (
                        <button 
                            onClick={() => generatePlans(false)}
                            disabled={isGenerating || !uploadedFile}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold shadow-lg transition-all text-lg
                                ${isGenerating || !uploadedFile
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transform hover:scale-[1.02]'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    正在读取文件并生成计划...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-6 h-6"/>
                                    开始生成完整周计划
                                </>
                            )}
                        </button>
                     ) : (
                        // Refinement Interface (Shows after generation)
                        <div className="bg-white border border-orange-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                             <label className="block text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                步骤 3: 调整与修改 (可选)
                             </label>
                             <div className="flex gap-2">
                                <textarea
                                    ref={modifyInputRef}
                                    value={modificationPrompt}
                                    onChange={(e) => setModificationPrompt(e.target.value)}
                                    placeholder="例如：周二的体育活动难度太大了，请降低一点；周三的美工区可以改成做树叶书签..."
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none h-20 text-sm"
                                />
                                <button
                                    onClick={() => generatePlans(true)}
                                    disabled={isRefining || !uploadedFile}
                                    className={`px-4 rounded-lg font-bold shadow transition-all flex flex-col items-center justify-center gap-1 min-w-[100px]
                                        ${isRefining
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                                        }`}
                                >
                                    {isRefining ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                    <span className="text-xs">{isRefining ? '修改中...' : '提交修改'}</span>
                                </button>
                             </div>
                             <div className="mt-2 text-right">
                                 <button 
                                    onClick={() => {
                                        if(window.confirm("确定要清除当前数据并重新开始吗？")) {
                                            setWeeklyData(INITIAL_DATA);
                                            setUploadedFile(null);
                                            setShowConfig(true);
                                        }
                                    }} 
                                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                                 >
                                    重新上传/生成
                                 </button>
                             </div>
                        </div>
                     )}
                </div>
                
                {uploadError && (
                  <div className="flex items-start gap-2 p-3 text-red-600 bg-red-50 border border-red-100 rounded-lg text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{uploadError}</p>
                  </div>
                )}
            </div>
        </div>

        {/* Day Selector */}
        {weeklyData !== INITIAL_DATA && (
            <div className="flex border-b overflow-x-auto">
            {weeklyData.dailyPlans.map((plan, index) => (
                <button
                key={index}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors whitespace-nowrap ${
                    selectedDayIndex === index
                    ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
                >
                {plan.day} ({plan.date.slice(5)})
                </button>
            ))}
            </div>
        )}

        {/* Plan Display Area */}
        <div className="p-8 overflow-x-auto bg-gray-100">
           {/* The wrapper below is what gets selected for copy */}
          <div ref={tableRef} className="bg-white p-4 min-w-[800px] shadow-sm">
            {weeklyData.dailyPlans.length > 0 && (
                <DailyPlanTable plan={weeklyData.dailyPlans[selectedDayIndex]} weeklyInfo={weeklyData.weeklyInfo} />
            )}
          </div>
        </div>

        {/* Footer / Instructions */}
        <div className="bg-gray-50 p-6 border-t text-sm text-gray-500 flex flex-col gap-2">
          <p className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <strong>使用说明：</strong> 上传周计划文件（支持图片或PDF），确认生成规则后点击生成。如需微调，可在生成后输入修改意见。
          </p>
          <p className="flex items-center gap-2">
             <Printer className="w-4 h-4" />
             <strong>打印/导出：</strong> 点击右上角“复制表格”按钮，然后直接在 Word 中粘贴即可完美保留格式。
          </p>
        </div>

      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error("Failed to find root element");
}