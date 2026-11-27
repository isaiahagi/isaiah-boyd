export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "learnai.isaiahboyd.xyz") {
      url.pathname = "/learnai" + url.pathname;
    }

    return env.ASSETS.fetch(new Request(url, request));
  }
};
