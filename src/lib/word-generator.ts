import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, SectionType, HeightRule, VerticalAlign } from "docx";
import { ResumeData } from "@/types/resume";
import JSZip from "jszip";

// 不足項目チェック用の型
export interface MissingItems {
  birthDate: boolean;
  address: boolean;
  phone: boolean;
}

// 共通スタイル定義
const BORDER_STYLE = {
  top: { style: BorderStyle.SINGLE, size: 1 },
  bottom: { style: BorderStyle.SINGLE, size: 1 },
  left: { style: BorderStyle.SINGLE, size: 1 },
  right: { style: BorderStyle.SINGLE, size: 1 },
};

// Base64画像をBufferに変換するヘルパー
const base64ToBuffer = (base64: string): Uint8Array => {
  const binaryString = atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * 履歴書 (Rirekisho) Wordドキュメント生成
 * JIS規格 (見開き2ページ) 完全準拠レイアウト
 */
const createRirekishoDoc = (data: ResumeData): Document => {
  // 写真データの準備 (縦横比を考慮した簡易サイズ調整)
  let photoRun: ImageRun | Paragraph = new Paragraph({ text: "写\n真\n(3x4cm)", alignment: AlignmentType.CENTER });
  
  if (data.basicInfo.photoBase64) {
    try {
      const imgBuffer = base64ToBuffer(data.basicInfo.photoBase64);
      // メモ: 本当は画像の実サイズを取得して比率計算すべきだが、
      // ここでは縦長写真を想定して、枠(3cm x 4cm)に収まるように少し小さめに設定
      // width: 30mm = 113px, height: 40mm = 151px
      photoRun = new ImageRun({
        data: imgBuffer,
        transformation: { width: 113, height: 151 }, 
        type: "jpg", 
      });
    } catch (e) {
      console.warn("Failed to process photo image", e);
    }
  }

  // ■ 1ページ目: 基本情報 + 学歴・職歴 (上半分程度)
  
  // テーブル1: 基本情報
  const basicInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDER_STYLE,
    rows: [
      // 名前とふりがな
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ text: "ふりがな", alignment: AlignmentType.LEFT, spacing: { before: 50 } }),
              new Paragraph({ 
                children: [new TextRun({ text: `${data.basicInfo.lastNameKana || ''} ${data.basicInfo.firstNameKana || ''}`, size: 20 })],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({ text: "氏　名", alignment: AlignmentType.LEFT, spacing: { before: 100 } }),
              new Paragraph({ 
                children: [new TextRun({ text: `${data.basicInfo.lastName} ${data.basicInfo.firstName}`, size: 48, bold: true })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
              }),
            ],
            width: { size: 75, type: WidthType.PERCENTAGE },
          }),
          // 写真欄
          new TableCell({
            children: [
              new Paragraph({
                children: data.basicInfo.photoBase64 ? [photoRun as ImageRun] : [new TextRun("写\n真\n(3x4cm)")],
                alignment: AlignmentType.CENTER,
              })
            ],
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      // 生年月日・性別
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ 
                text: `${data.basicInfo.birthDate || '        '}年    月    日生  (満    歳)      ${data.basicInfo.gender || '      '}`, 
                spacing: { before: 100, after: 100 } 
              }),
            ],
            columnSpan: 2,
          }),
        ],
      }),
      // 住所・連絡先
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ text: "現住所", spacing: { before: 50 } }),
              new Paragraph({ text: `(〒       -       )`, spacing: { before: 50 } }),
              new Paragraph({ text: `${data.basicInfo.address || ''}`, spacing: { after: 100 } }),
              new Paragraph({ text: "電話番号", spacing: { before: 100 } }),
              new Paragraph({ text: `${data.basicInfo.phone || ''}`, spacing: { after: 100 } }),
              new Paragraph({ text: "Email", spacing: { before: 100 } }),
              new Paragraph({ text: `${data.basicInfo.email}`, spacing: { after: 100 } }),
            ],
            columnSpan: 2,
          }),
        ],
      }),
    ],
  });

  // テーブル2: 学歴・職歴 (1ページ目を埋める量)
  // JIS規格では、学歴・職歴欄は1ページ目の半分以上を占め、足りなければ2ページ目に続く。
  // 今回は簡易的に、学歴と職歴を全て1ページ目のテーブル定義に入れるが、行数が多い場合はWord側で自動的に改ページされる挙動を利用する。
  
  const historyRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "年", alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, borders: BORDER_STYLE }),
        new TableCell({ children: [new Paragraph({ text: "月", alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE }, borders: BORDER_STYLE }),
        new TableCell({ children: [new Paragraph({ text: "学歴・職歴", alignment: AlignmentType.CENTER })], width: { size: 85, type: WidthType.PERCENTAGE }, borders: BORDER_STYLE }),
      ],
    }),
    // 学歴
    new TableRow({
      children: [
        new TableCell({ children: [], borders: BORDER_STYLE }),
        new TableCell({ children: [], borders: BORDER_STYLE }),
        new TableCell({ children: [new Paragraph({ text: "学　歴", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
      ],
    }),
    ...data.education.map(edu => {
      const [startYear, startMonth] = (edu.startDate || "").split("-");
      const [endYear, endMonth] = (edu.endDate || "").split("-");
      return [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: startYear || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
            new TableCell({ children: [new Paragraph({ text: startMonth || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
            new TableCell({ children: [new Paragraph({ text: `${edu.schoolName} 入学` })], borders: BORDER_STYLE }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: endYear || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
            new TableCell({ children: [new Paragraph({ text: endMonth || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
            new TableCell({ children: [new Paragraph({ text: `${edu.schoolName} 卒業` })], borders: BORDER_STYLE }),
          ]
        })
      ];
    }).flat(),
    
    // 職歴
    new TableRow({
      children: [
        new TableCell({ children: [], borders: BORDER_STYLE }),
        new TableCell({ children: [], borders: BORDER_STYLE }),
        new TableCell({ children: [new Paragraph({ text: "職　歴", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
      ],
    }),
    ...data.workExperience.flatMap(work => {
      const [startYear, startMonth] = (work.startDate || "").split("-");
      const [endYear, endMonth] = (work.endDate || "").split("-");
      return [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: startYear || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
            new TableCell({ children: [new Paragraph({ text: startMonth || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
            new TableCell({ children: [new Paragraph({ text: `${work.companyName} 入社` })], borders: BORDER_STYLE }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: endYear || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
            new TableCell({ children: [new Paragraph({ text: endMonth || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
            new TableCell({ children: [new Paragraph({ text: work.isCurrent ? "現在に至る" : `${work.companyName} 退社` })], borders: BORDER_STYLE }),
          ],
        })
      ];
    }),
    // 以上
    new TableRow({
      children: [
        new TableCell({ children: [], borders: BORDER_STYLE }),
        new TableCell({ children: [], borders: BORDER_STYLE }),
        new TableCell({ children: [new Paragraph({ text: "以　上", alignment: AlignmentType.RIGHT })], borders: BORDER_STYLE }),
      ],
    }),
  ];

  // 空行を追加してページを埋める (最低限の行数を確保)
  const minRows = 15;
  const currentRows = historyRows.length;
  for (let i = 0; i < minRows - currentRows; i++) {
    historyRows.push(
      new TableRow({
        height: { value: 400, rule: HeightRule.AT_LEAST }, // 高さを確保
        children: [
          new TableCell({ children: [], borders: BORDER_STYLE }),
          new TableCell({ children: [], borders: BORDER_STYLE }),
          new TableCell({ children: [], borders: BORDER_STYLE }),
        ]
      })
    );
  }

  const historyTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: historyRows,
  });


  // ■ 2ページ目: 免許・資格、志望動機、本人希望 (見開き右側)
  
  // 免許・資格テーブル (行数を多めに確保)
  const certRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "年", alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, borders: BORDER_STYLE }),
        new TableCell({ children: [new Paragraph({ text: "月", alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE }, borders: BORDER_STYLE }),
        new TableCell({ children: [new Paragraph({ text: "免許・資格", alignment: AlignmentType.CENTER })], width: { size: 85, type: WidthType.PERCENTAGE }, borders: BORDER_STYLE }),
      ],
    }),
    ...data.certifications.map(cert => new TableRow({
      children: [
        new TableCell({ children: [], borders: BORDER_STYLE }),
        new TableCell({ children: [], borders: BORDER_STYLE }),
        new TableCell({ children: [new Paragraph({ text: cert })], borders: BORDER_STYLE }),
      ]
    })),
  ];
  // 免許・資格の空行埋め
  const minCertRows = 6;
  for (let i = 0; i < minCertRows - data.certifications.length; i++) {
    certRows.push(
      new TableRow({
        height: { value: 400, rule: HeightRule.AT_LEAST },
        children: [
          new TableCell({ children: [], borders: BORDER_STYLE }),
          new TableCell({ children: [], borders: BORDER_STYLE }),
          new TableCell({ children: [], borders: BORDER_STYLE }),
        ]
      })
    );
  }
  
  const certTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: certRows
  });

  // 志望動機など (大きな枠)
  const motivationTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDER_STYLE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ text: "志望の動機・特技・好きな学科・アピールポイントなど", spacing: { before: 50, after: 50 } }),
              // 注記削除 (Web画面でのみ案内)
              new Paragraph({ text: data.selfPromotion, spacing: { after: 100 } }),
              new Paragraph({ text: "", spacing: { after: 1200 } }) // 余白確保
            ]
          })
        ]
      })
    ]
  });

  // 本人希望欄 (大きな枠)
  const requestTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDER_STYLE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ text: "本人希望記入欄 (給料・職種・勤務時間・勤務地・その他)", spacing: { before: 50, after: 50 } }),
              new Paragraph({ text: "貴社の規定に従います。", spacing: { after: 100 } }),
              new Paragraph({ text: "", spacing: { after: 1200 } }) // 余白確保
            ]
          })
        ]
      })
    ]
  });

  return new Document({
    sections: [
      // セクション1: 左ページ (基本情報 + 学歴職歴)
      {
        properties: {},
        children: [
          new Paragraph({ text: "履　歴　書", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
          new Paragraph({ text: `${new Date().getFullYear()}年 ${new Date().getMonth() + 1}月 ${new Date().getDate()}日 現在`, alignment: AlignmentType.RIGHT, spacing: { after: 100 } }),
          basicInfoTable,
          new Paragraph({ text: "", spacing: { after: 200 } }),
          historyTable,
        ],
      },
      // セクション2: 右ページ (免許資格 + 志望動機 + 希望欄)
      // JIS規格では本来1枚の大きな紙だが、Wordではページ区切りで表現する。
      // 「履歴書(続き)」というタイトルは削除し、自然に続くようにする。
      {
        properties: { type: SectionType.NEXT_PAGE }, 
        children: [
          new Paragraph({ text: "", spacing: { after: 300 } }), // 上部余白調整
          certTable,
          new Paragraph({ text: "", spacing: { after: 200 } }),
          motivationTable,
          new Paragraph({ text: "", spacing: { after: 200 } }),
          requestTable,
        ],
      }
    ],
  });
};

/**
 * 職務経歴書 (Shokumu Keirekisho) Wordドキュメント生成
 * 一般的なフォーマット
 */
const createCvDoc = (data: ResumeData): Document => {
  return new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
             text: "職務経歴書",
             heading: HeadingLevel.TITLE,
             alignment: AlignmentType.CENTER,
             spacing: { after: 300 }
          }),
          new Paragraph({
            text: `${new Date().getFullYear()}年 ${new Date().getMonth() + 1}月 ${new Date().getDate()}日`,
            alignment: AlignmentType.RIGHT
          }),
          new Paragraph({
            text: `氏名：${data.basicInfo.lastName} ${data.basicInfo.firstName}`,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 300 }
          }),

          // 経歴要約
          new Paragraph({
            text: "【経歴要約】",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: data.professionalSummary,
            spacing: { after: 300 }
          }),

          // 職務内容
          new Paragraph({
            text: "【職務内容】",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }),
          
          ...data.workExperience.flatMap((work) => [
            new Paragraph({
              children: [
                new TextRun({
                   text: `${work.companyName}`,
                   bold: true,
                   size: 24,
                }),
                new TextRun({
                   text: `  (${work.startDate} ～ ${work.endDate || '現在'})`,
                })
              ],
              spacing: { before: 200, after: 100 },
              border: { bottom: { style: BorderStyle.SINGLE, space: 1, color: "auto" } }
            }),
            new Paragraph({
               text: `[役職] ${work.position}`,
               spacing: { after: 50 }
            }),
            new Paragraph({
               text: `[業務内容]`,
               spacing: { after: 50 }
            }),
            new Paragraph({
               text: work.description,
               spacing: { after: 100, before: 50 },
               indent: { left: 200 }
            }),
            new Paragraph({
               text: `[実績・取り組み]`,
               spacing: { after: 50 }
            }),
            ...(work.achievements || []).map(ach => 
               new Paragraph({
                 text: `・${ach}`,
                 indent: { left: 400 }
               })
            ),
          ]),

          // スキル
          new Paragraph({
            text: "【活かせる経験・知識・技術】",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400, after: 100 }
          }),
          new Paragraph({
             children: data.skills.map(skill => new TextRun({ text: `・${skill}\n` })),
             spacing: { after: 300 }
          }),

          // 自己PR (注記削除)
          new Paragraph({
            text: "【自己PR】",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: data.selfPromotion,
            spacing: { after: 300 }
          }),
          
          new Paragraph({
             text: "以上",
             alignment: AlignmentType.RIGHT,
             spacing: { before: 400 }
          })
        ],
      },
    ],
  });
};


/**
 * ZIP生成関数
 */
export const generateResumeZip = async (data: ResumeData): Promise<{ blob: Blob, missingItems: MissingItems }> => {
  const rirekishoDoc = createRirekishoDoc(data);
  const cvDoc = createCvDoc(data);
  
  const rirekishoBlob = await Packer.toBlob(rirekishoDoc);
  const cvBlob = await Packer.toBlob(cvDoc);

  const zip = new JSZip();
  zip.file("履歴書.docx", rirekishoBlob);
  zip.file("職務経歴書.docx", cvBlob);

  const zipBlob = await zip.generateAsync({ type: "blob" });

  // 不足項目チェック
  const missingItems: MissingItems = {
    birthDate: !data.basicInfo.birthDate,
    address: !data.basicInfo.address,
    phone: !data.basicInfo.phone,
  };

  return { blob: zipBlob, missingItems };
};
