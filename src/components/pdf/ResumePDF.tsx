import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeData } from '@/types/resume';

// 日本語フォントの登録 (今回は標準フォントで代用するが、本番ではIPAフォントなどを登録する必要がある)
// 注意: @react-pdf/rendererの標準フォントは日本語に対応していないため、
// 実際には日本語フォント (.ttf) をpublicフォルダに置いて登録する必要があります。
// ここではモックアップとして英語のみ、または文字化けを許容する形で実装します。
// ※本番環境では必ず日本語フォントを登録してください。

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica', // 日本語フォントがないためHelveticaを使用
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
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
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>RESUME (Rirekisho)</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{data.basicInfo.firstName} {data.basicInfo.lastName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{data.basicInfo.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {data.education.map((edu, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>{edu.schoolName}</Text>
            <Text>{edu.degree} | {edu.startDate} - {edu.endDate || 'Present'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Experience</Text>
        {data.workExperience.map((work, index) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold' }}>{work.companyName} - {work.position}</Text>
            <Text style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
              {work.startDate} - {work.endDate || 'Present'}
            </Text>
            <Text>{work.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <Text>{data.skills.join(', ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Self Promotion</Text>
        <Text>{data.selfPromotion}</Text>
      </View>
    </Page>
  </Document>
);

