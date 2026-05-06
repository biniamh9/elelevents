import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { adminSopOverviewChecklist, adminSopWorkflowStages } from "@/lib/admin-sop";

const colors = {
  ink: "#1f1b18",
  navy: "#1b2940",
  gold: "#b97a3d",
  goldSoft: "#f8eadb",
  border: "#e6d7c4",
  muted: "#6f6459",
  paper: "#fffdf9",
  panel: "#ffffff",
  placeholder: "#fbf6ef",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 30,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontSize: 10,
    lineHeight: 1.36,
  },
  coverPage: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 34,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontSize: 10.5,
    lineHeight: 1.38,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  coverStack: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
  },
  brandBlock: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  logo: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },
  eyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: colors.gold,
    fontWeight: 700,
  },
  heading: {
    fontSize: 28,
    lineHeight: 1.04,
    fontWeight: 700,
    color: colors.navy,
  },
  subheading: {
    fontSize: 12.5,
    lineHeight: 1.4,
    color: colors.muted,
  },
  pill: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.goldSoft,
    color: colors.gold,
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: 700,
  },
  metaCard: {
    width: 210,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  metaLabel: {
    fontSize: 8.2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.muted,
  },
  metaValue: {
    fontSize: 10.5,
    fontWeight: 700,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  panelHeading: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.navy,
  },
  bodyMuted: {
    color: colors.muted,
  },
  workflowBand: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fbf8f2",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  stageRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stageChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 8.2,
    color: colors.navy,
    fontWeight: 700,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  listRow: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },
  bullet: {
    width: 12,
    color: colors.gold,
    fontWeight: 700,
  },
  listText: {
    flexGrow: 1,
  },
  stageTitleRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.navy,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.goldSoft,
    color: colors.gold,
    fontSize: 8.2,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
  },
  sectionGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
  },
  sectionCard: {
    flexGrow: 1,
    width: "50%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
    color: colors.gold,
  },
  screenshotPlaceholder: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d9c6b0",
    backgroundColor: colors.placeholder,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  screenshotText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 9.5,
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 9.5,
    fontWeight: 700,
    color: colors.navy,
  },
  footerCopy: {
    color: colors.muted,
    fontSize: 8.6,
  },
  pageNumber: {
    color: colors.muted,
    fontSize: 8.6,
  },
});

function chunkStages<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

export default function AdminSopPdfFile({
  logoSrc,
}: {
  logoSrc?: string | null;
}) {
  const stageGroups = chunkStages(adminSopWorkflowStages, 2);

  return (
    <Document
      title="Elel Events Admin SOP"
      author="Elel Events & Design"
      subject="Admin standard operating procedure"
      creator="Elel Events & Design"
      producer="Elel Events & Design"
    >
      <Page size="LETTER" style={styles.coverPage}>
        <View style={styles.coverStack}>
          <View style={styles.header}>
            <View style={styles.brandBlock}>
              {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
              <Text style={styles.eyebrow}>Elel Events & Design</Text>
              <Text style={styles.heading}>Admin CRM Standard Operating Procedure</Text>
              <Text style={styles.subheading}>
                Use this SOP to move every customer request from new inquiry to archived with one clear, repeatable workflow across CRM, sales, contracts, payments, events, and finance.
              </Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Document</Text>
              <Text style={styles.metaValue}>Admin SOP PDF</Text>
              <Text style={styles.metaLabel}>Scope</Text>
              <Text style={styles.metaValue}>Customer request lifecycle</Text>
              <Text style={styles.metaLabel}>Stages</Text>
              <Text style={styles.metaValue}>{adminSopWorkflowStages.length} tracked checkpoints</Text>
            </View>
          </View>

          <Text style={styles.pill}>Internal operations guide</Text>

          <View style={styles.workflowBand}>
            <Text style={styles.panelHeading}>Lifecycle covered in this SOP</Text>
            <View style={styles.stageRow}>
              {adminSopWorkflowStages.map((stage) => (
                <Text key={stage.title} style={styles.stageChip}>
                  {stage.title}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelHeading}>Operating rules</Text>
            <View style={styles.list}>
              {adminSopOverviewChecklist.map((item) => (
                <View key={item} style={styles.listRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelHeading}>How to use this PDF</Text>
            <View style={styles.list}>
              <View style={styles.listRow}>
                <Text style={styles.bullet}>1</Text>
                <Text style={styles.listText}>Open the matching admin screen named in each stage.</Text>
              </View>
              <View style={styles.listRow}>
                <Text style={styles.bullet}>2</Text>
                <Text style={styles.listText}>Follow the admin steps in order and keep the CRM status aligned.</Text>
              </View>
              <View style={styles.listRow}>
                <Text style={styles.bullet}>3</Text>
                <Text style={styles.listText}>Use the checklist before moving the customer to the next lifecycle stage.</Text>
              </View>
              <View style={styles.listRow}>
                <Text style={styles.bullet}>4</Text>
                <Text style={styles.listText}>Add real screenshots into the marked placeholders when creating a team training version.</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {stageGroups.map((group, index) => (
        <Page key={`group-${index}`} size="LETTER" style={styles.page}>
          <View style={styles.stack}>
            {group.map((stage) => (
              <View key={stage.title} style={styles.panel} wrap={false}>
                <View style={styles.stageTitleRow}>
                  <View style={styles.brandBlock}>
                    <Text style={styles.eyebrow}>Lifecycle stage</Text>
                    <Text style={styles.stageTitle}>{stage.title}</Text>
                    <Text style={styles.bodyMuted}>{stage.purpose}</Text>
                  </View>
                  <Text style={styles.statusBadge}>{stage.crmStatus}</Text>
                </View>

                <View style={styles.sectionGrid}>
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Admin screen</Text>
                    <Text>{stage.adminScreen}</Text>
                  </View>
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Screenshot placeholder</Text>
                    <View style={styles.screenshotPlaceholder}>
                      <Text style={styles.screenshotText}>{stage.screenshotPlaceholder}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionGrid}>
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Admin steps</Text>
                    <View style={styles.list}>
                      {stage.adminSteps.map((item, stepIndex) => (
                        <View key={item} style={styles.listRow}>
                          <Text style={styles.bullet}>{stepIndex + 1}</Text>
                          <Text style={styles.listText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Checklist before moving on</Text>
                    <View style={styles.list}>
                      {stage.checklist.map((item) => (
                        <View key={item} style={styles.listRow}>
                          <Text style={styles.bullet}>□</Text>
                          <Text style={styles.listText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.footer}>
              <View>
                <Text style={styles.footerBrand}>Elel Events & Design</Text>
                <Text style={styles.footerCopy}>Luxury event CRM operating guide for internal admin workflow.</Text>
              </View>
              <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                fixed
              />
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}
