import axios from 'axios'

class GistProvider {
  token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }
  get(gist_id: string) {
    // get 接口不强制校验 token，无 token 时，访问不到没权限的 gist
    const headers = this.token ? { Authorization: `token ${this.token}` } : {};
    return axios.get<{
      files: Record<
        string,
        {
          content: string;
        }
      >;
      updated_at: string;
    }>(`https://api.github.com/gists/${gist_id}`, {
      headers,
    });
  }
  update(
    id: string,
    params: {
      filename: string;
      content: string;
    }
  ) {
    if (!this.token || !id) {
      return null;
    }

    const { filename, content } = params;
    return axios.patch(
      `https://api.github.com/gists/${id}`,
      {
        files: { [filename]: { content } },
      },
      {
        headers: { Authorization: `token ${this.token}` },
      }
    );
  }
}

export default new GistProvider()