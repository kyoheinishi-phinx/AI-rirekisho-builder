import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { ResumeData } from '@/types/resume';

// 日本語フォントの登録
// Vercel等の環境依存を避けるため、信頼性の高いCDN (unpkg) からフォントを直接読み込む
// react-pdfは .ttf, .woff, .woff2 をサポートしています
Font.register({
  family: 'NotoSansJP',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/latin-400-normal.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/latin-700-normal.ttf',
      fontWeight: 'bold',
    }
  ],
});

// PDFレイアウトをWord版に合わせるためのスタイル調整
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'NotoSansJP',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center', // 中央揃え
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  kana: {
    fontSize: 10,
    marginBottom: 5,
  },
  contact: {
    fontSize: 10,
    marginBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 4,
    marginBottom: 8,
  },
  // 職務経歴用スタイル
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  workMeta: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  description: {
    marginBottom: 4,
  },
  achievement: {
    fontSize: 10,
    marginLeft: 10,
  },
  // ... 他のスタイルは必要に応じて追加
});

// ... (Interface定義は変更なし)

export const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* 1. タイトル & 基本情報 (中央揃え) */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.title}>履歴書 (Resume)</Text>
        <Text style={styles.name}>
           {data.basicInfo.lastName} {data.basicInfo.firstName}
        </Text>
        <Text style={styles.kana}>
           {data.basicInfo.lastNameKana} {data.basicInfo.firstNameKana}
        </Text>
        <Text style={styles.contact}>
           Email: {data.basicInfo.email} | Phone: {data.basicInfo.phone}
        </Text>
      </View>

      {/* 2. 自己PR */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>■ 自己PR (Self Promotion)</Text>
        <Text>{data.selfPromotion}</Text>
      </View>

      {/* 3. 職務要約 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>■ 職務要約 (Professional Summary)</Text>
        <Text>{data.professionalSummary}</Text>
      </View>

      {/* 4. スキル */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>■ スキル (Skills)</Text>
        <Text>{data.skills.map(skill => `• ${skill}`).join('   ')}</Text>
      </View>

      {/* 5. 職務経歴 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>■ 職務経歴 (Work Experience)</Text>
        {data.workExperience.map((work, index) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <Text style={styles.companyName}>{work.companyName}</Text>
            <Text style={styles.workMeta}>
              {work.startDate} - {work.endDate || '現在'} | {work.position}
            </Text>
            <Text style={styles.description}>{work.description}</Text>
            {work.achievements && work.achievements.map((ach, i) => (
              <Text key={i} style={styles.achievement}>• {ach}</Text>
            ))}
          </View>
        ))}
      </View>

      {/* 6. 学歴 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>■ 学歴 (Education)</Text>
        {data.education.map((edu, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>{edu.schoolName}</Text>
            <Text>{edu.degree} | {edu.startDate} - {edu.endDate || '現在'}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
