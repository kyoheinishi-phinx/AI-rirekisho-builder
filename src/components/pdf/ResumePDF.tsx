import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { ResumeData } from '@/types/resume';

// 日本語フォントの登録
// ローカルのpublicフォルダから読み込むように変更
// (クライアントサイドで実行されるため、URLは /fonts/... となる)
Font.register({
  family: 'NotoSansJP',
  fonts: [
    {
      src: '/fonts/NotoSansJP-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/NotoSansJP-Bold.ttf',
      fontWeight: 'bold',
    }
  ],
});

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
  },
  photoContainer: {
    width: 80,
    height: 100,
    marginLeft: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
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
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>履歴書 (Resume)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>氏名 (Name):</Text>
            <Text style={styles.value}>
              {data.basicInfo.firstName} {data.basicInfo.lastName}
              {data.basicInfo.firstNameKana && data.basicInfo.lastNameKana 
                ? ` (${data.basicInfo.firstNameKana} ${data.basicInfo.lastNameKana})` 
                : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.basicInfo.email}</Text>
          </View>
          {data.basicInfo.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>電話番号:</Text>
              <Text style={styles.value}>{data.basicInfo.phone}</Text>
            </View>
          )}
        </View>

        {/* 顔写真エリア */}
        {data.basicInfo.photoBase64 && (
          <View style={styles.photoContainer}>
            <Image src={data.basicInfo.photoBase64} style={styles.photo} />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>学歴 (Education)</Text>
        {data.education.map((edu, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>{edu.schoolName}</Text>
            <Text>{edu.degree} | {edu.startDate} - {edu.endDate || '現在'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>職務経歴 (Work Experience)</Text>
        {data.workExperience.map((work, index) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold' }}>{work.companyName} - {work.position}</Text>
            <Text style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
              {work.startDate} - {work.endDate || '現在'}
            </Text>
            <Text>{work.description}</Text>
            {work.achievements && work.achievements.length > 0 && (
               <View style={{ marginTop: 4, marginLeft: 10 }}>
                 {work.achievements.map((ach, i) => (
                   <Text key={i} style={{ fontSize: 10 }}>• {ach}</Text>
                 ))}
               </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>スキル (Skills)</Text>
        <Text>{data.skills.join(', ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>自己PR (Self Promotion)</Text>
        <Text>{data.selfPromotion}</Text>
      </View>
    </Page>
  </Document>
);
