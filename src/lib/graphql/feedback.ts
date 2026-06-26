import { gql } from "@apollo/client";

export const SUBMIT_BUG_REPORT = gql`
  mutation SubmitBugReport($data: BugReportInput!) {
    submitBugReport(data: $data)
  }
`;


export const ADMIN_BUG_REPORTS_QUERY = gql`
  query AdminBugReports($page: Int, $perPage: Int, $status: String) {
    adminBugReports(page: $page, perPage: $perPage, status: $status) {
      reports {
        id
        userId
        email
        topic
        message
        platform
        status
        created
      }
      page
      perPage
      hasNext
    }
  }
`;


export const ADMIN_BUG_REPORTS_UNREAD_COUNT = gql`
  query AdminBugReportsUnreadCount {
    adminBugReportsUnreadCount
  }
`;


export const ADMIN_BUG_REPORT_SET_STATUS = gql`
  mutation AdminBugReportSetStatus($id: ID!, $status: String!) {
    adminBugReportSetStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;


export const ADMIN_BUG_REPORT_DELETE = gql`
  mutation AdminBugReportDelete($id: ID!) {
    adminBugReportDelete(id: $id)
  }
`;

// ===== Admin: usuarios =====
