import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { ResumeData } from "@/types/resume";

export const generateWordDocument = async (data: ResumeData): Promise<Blob> => {
  // 写真の処理 (Base64 -> Buffer)
  let photoImage = null;
  // docxライブラリはBase64画像を直接扱うのが少し複雑なため、
  // 今回は写真は一旦除外してテキスト中心のWord生成を行います。
  // (Word上で後から貼るほうがユーザーにとっても編集しやすい場合があるため)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // タイトル
          new Paragraph({
            text: "履歴書 (Resume)",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // 基本情報 (名前)
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.basicInfo.lastName} ${data.basicInfo.firstName}`,
                bold: true,
                size: 32,
              }),
              new TextRun({
                text: `  (${data.basicInfo.lastNameKana || ''} ${data.basicInfo.firstNameKana || ''})`,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),

          // 連絡先
          new Paragraph({
            children: [
              new TextRun({ text: `Email: ${data.basicInfo.email}` }),
              new TextRun({ text: " | " }),
              new TextRun({ text: `Phone: ${data.basicInfo.phone || ''}` }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // セクション: 自己PR
          new Paragraph({
            text: "■ 自己PR (Self Promotion)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            text: data.selfPromotion,
            spacing: { after: 300 },
          }),

          // セクション: 職務要約
          new Paragraph({
            text: "■ 職務要約 (Professional Summary)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            text: data.professionalSummary,
            spacing: { after: 300 },
          }),

          // セクション: スキル
          new Paragraph({
            text: "■ スキル (Skills)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: data.skills.map(skill => new TextRun({ text: `• ${skill}   ` })),
            spacing: { after: 300 },
          }),

          // セクション: 職務経歴
          new Paragraph({
            text: "■ 職務経歴 (Work Experience)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
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
                  text: `  (${work.startDate} - ${work.endDate || '現在'})`,
                  italics: true,
                }),
              ],
              spacing: { before: 100 },
            }),
            new Paragraph({
              text: `役職: ${work.position}`,
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: work.description,
              spacing: { after: 50 },
            }),
            // 実績リスト
            ...(work.achievements || []).map(ach => 
              new Paragraph({
                text: `• ${ach}`,
                indent: { left: 300 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }), // 空行
          ]),

          // セクション: 学歴
          new Paragraph({
            text: "■ 学歴 (Education)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          ...data.education.map(edu => 
            new Paragraph({
              children: [
                new TextRun({ text: edu.schoolName, bold: true }),
                new TextRun({ text: ` - ${edu.degree}` }),
                new TextRun({ text: `  (${edu.startDate} - ${edu.endDate || '現在'})` }),
              ],
            })
          ),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};

