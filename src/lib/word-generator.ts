import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
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

/**
 * 履歴書 (Rirekisho) Wordドキュメント生成
 * JIS規格風のレイアウト
 */
const createRirekishoDoc = (data: ResumeData): Document => {
  return new Document({
    sections: [
      {
        properties: {},
        children: [
          // タイトル
          new Paragraph({
            text: "履　歴　書",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // 日付
          new Paragraph({
            text: `${new Date().getFullYear()}年 ${new Date().getMonth() + 1}月 ${new Date().getDate()}日 現在`,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 100 },
          }),

          // 基本情報テーブル
          new Table({
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
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                  // 写真欄 (プレースホルダー)
                  new TableCell({
                    children: [
                      new Paragraph({ text: "写", alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "真", alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "(3x4cm)", alignment: AlignmentType.CENTER, spacing: { before: 400 } }),
                    ],
                    verticalAlign: AlignmentType.CENTER,
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              // 生年月日・性別
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ 
                        text: `${data.basicInfo.birthDate || '      '}年    月    日生  (満    歳)      ${data.basicInfo.gender || '      '}`, 
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
                      new Paragraph({ text: "電話番号 / Email", spacing: { before: 100 } }),
                      new Paragraph({ text: `${data.basicInfo.phone || ''}  /  ${data.basicInfo.email}`, spacing: { after: 100 } }),
                    ],
                    columnSpan: 2,
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }), // スペーサー

          // 学歴・職歴タイトル行
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "年", alignment: AlignmentType.CENTER })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    borders: BORDER_STYLE,
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "月", alignment: AlignmentType.CENTER })],
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    borders: BORDER_STYLE,
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "学歴・職歴", alignment: AlignmentType.CENTER })],
                    width: { size: 85, type: WidthType.PERCENTAGE },
                    borders: BORDER_STYLE,
                  }),
                ],
              }),
              // 学歴ヘッダー
              new TableRow({
                children: [
                  new TableCell({ children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } }),
                  new TableCell({ children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } }),
                  new TableCell({ 
                    children: [new Paragraph({ text: "学　歴", alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 } })], 
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } 
                  }),
                ],
              }),
              // 学歴データ
              ...data.education.map(edu => {
                const [year, month] = (edu.startDate || "").split("-");
                return new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: year || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
                    new TableCell({ children: [new Paragraph({ text: month || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
                    new TableCell({ 
                      children: [new Paragraph({ text: `${edu.schoolName} ${edu.degree} 入学` })], 
                      borders: BORDER_STYLE 
                    }),
                  ],
                });
              }),
               // 卒業行 (簡易的に同じデータから推測または空行)
               ...data.education.map(edu => {
                const [year, month] = (edu.endDate || "").split("-");
                return new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: year || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
                    new TableCell({ children: [new Paragraph({ text: month || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
                    new TableCell({ 
                      children: [new Paragraph({ text: `${edu.schoolName} 卒業` })], 
                      borders: BORDER_STYLE 
                    }),
                  ],
                });
              }),
              
              // 職歴ヘッダー
              new TableRow({
                children: [
                  new TableCell({ children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } }),
                  new TableCell({ children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } }),
                  new TableCell({ 
                    children: [new Paragraph({ text: "職　歴", alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 } })], 
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } 
                  }),
                ],
              }),
              // 職歴データ
              ...data.workExperience.flatMap(work => {
                const [startYear, startMonth] = (work.startDate || "").split("-");
                const [endYear, endMonth] = (work.endDate || "").split("-");
                
                return [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: startYear || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
                      new TableCell({ children: [new Paragraph({ text: startMonth || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
                      new TableCell({ 
                        children: [new Paragraph({ text: `${work.companyName} 入社` })], 
                        borders: BORDER_STYLE 
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: endYear || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
                      new TableCell({ children: [new Paragraph({ text: endMonth || "", alignment: AlignmentType.CENTER })], borders: BORDER_STYLE }),
                      new TableCell({ 
                        children: [new Paragraph({ text: work.isCurrent ? "現在に至る" : `${work.companyName} 退社` })], 
                        borders: BORDER_STYLE 
                      }),
                    ],
                  })
                ];
              }),
              // 以上
              new TableRow({
                children: [
                  new TableCell({ children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } }),
                  new TableCell({ children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } }),
                  new TableCell({ 
                    children: [new Paragraph({ text: "以　上", alignment: AlignmentType.RIGHT, spacing: { after: 100 } })], 
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } } 
                  }),
                ],
              }),
            ],
          }),
          
          new Paragraph({ text: "", spacing: { after: 200 } }),

          // 自己PR欄
           new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BORDER_STYLE,
            rows: [
              new TableRow({
                 children: [
                    new TableCell({
                       children: [
                          new Paragraph({ text: "志望の動機・特技・好きな学科・アピールポイントなど", spacing: { before: 50, after: 50 } }),
                          new Paragraph({ text: data.selfPromotion, spacing: { after: 800 } })
                       ]
                    })
                 ]
              })
            ]
           })
        ],
      },
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

          // 自己PR
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
