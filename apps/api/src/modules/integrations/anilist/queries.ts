export const ANILIST_MEDIA_OVERVIEW_QUERY = `
query MediaOverview($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    siteUrl
    format
    status
    description(asHtml: false)
    isAdult
    title {
      romaji
      english
      native
    }
    externalLinks {
      site
      url
    }
  }
}
`;

export const ANILIST_MEDIA_CHARACTERS_QUERY = `
query MediaCharacters($id: Int!, $page: Int!, $perPage: Int!) {
  Media(id: $id, type: ANIME) {
    id
    characters(page: $page, perPage: $perPage, sort: [ROLE, RELEVANCE, ID]) {
      pageInfo {
        currentPage
        perPage
        hasNextPage
        total
      }
      edges {
        role
        node {
          id
          name {
            full
            alternative
          }
        }
        voiceActors(sort: [RELEVANCE, ID]) {
          id
          name {
            full
          }
          languageV2
        }
      }
    }
  }
}
`;

export const ANILIST_MEDIA_STAFF_QUERY = `
query MediaStaff($id: Int!, $page: Int!, $perPage: Int!) {
  Media(id: $id, type: ANIME) {
    id
    staff(page: $page, perPage: $perPage, sort: [RELEVANCE, ID]) {
      pageInfo {
        currentPage
        perPage
        hasNextPage
        total
      }
      edges {
        role
        node {
          id
          name {
            full
          }
        }
      }
    }
  }
}
`;

export const ANILIST_MEDIA_STUDIOS_QUERY = `
query MediaStudios($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    studios {
      edges {
        isMain
        node {
          id
          name
          isAnimationStudio
        }
      }
    }
  }
}
`;
