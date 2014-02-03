using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using ProductStore.Models;

namespace ProductStore.Controllers
{
    public class MashupController : ApiController
    {
        private static HttpClient httpClient;
        private static HttpClient GetClient()
        {

            if (httpClient != null)
                return httpClient;
            else
            {
                httpClient = new HttpClient();
                httpClient.BaseAddress = new Uri("http://localhost:9000/");

                // Add an Accept header for JSON format.
                httpClient.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue("application/json"));
                return httpClient;
            }
        }

        public async Task<List<Story>> GetContent(string topic)
        {
            List<Story> result = new List<Story>();

            // Check that we have a topic or return empty list
            if (topic == null)
            {
                return result;
            }

            // Isolate topic to ensure we have a single term
            string queryToken = topic.Split(new char[] { '&' }).FirstOrDefault();

            // Submit async query requests and process responses in parallel
            List<Story>[] queryResults = await Task.WhenAll(
                ExecuteDiggQuery(queryToken),
                ExecuteDeliciousQuery(queryToken));

            // Aggregate results from digg and delicious
            foreach (List<Story> queryResult in queryResults)
            {
                result.AddRange(queryResult);
            }

            return result;
        }

        private static async Task<List<Story>> ExecuteDiggQuery(string queryToken)
        {
            List<Story> result = new List<Story>();

            // URI query for a basic digg query -- see http//developers.digg.com/documentation
            string query = string.Format("https://wiki.ushahidi.com/rest/shortcuts/latest/shortcuts/4216/b88e4b59f0d9856cccab8db896885e87?_=1387439958681", queryToken);

            // Submit async request 
            HttpResponseMessage diggResponse = await GetClient().GetAsync(query);

            // Read result using JsonValue and process the stories 
            if (diggResponse.IsSuccessStatusCode)
            {
                JObject diggResult = await diggResponse.Content.ReadAsAsync<JObject>();

                foreach (var story in diggResult["shortcuts"].Children().AsEnumerable())
                {
                    result.Add(new Story
                    {
                        Service = "Service1",
                        Source = story["context"].ToString(),
                        Description = story["param"].ToString()
                    });
                }
            }

            return result;
        }

        private static async Task<List<Story>> ExecuteDeliciousQuery(string queryToken)
        {
            List<Story> result = new List<Story>();

            // URI query for a basic delicious query -- see http//delicious.com/developers
            string query = string.Format("https://wiki.ushahidi.com/rest/create-dialog/1.0/blueprints/web-items?spaceKey=~dayoo&_=1387439958514", queryToken);
        
            // Submit async request 
            HttpResponseMessage deliciousResponse = await GetClient().GetAsync(query);

            // Read result using JsonValue and process the stories 
            if (deliciousResponse.IsSuccessStatusCode)
            {
                JArray deliciousResult = await deliciousResponse.Content.ReadAsAsync<JArray>();

                foreach (var story in deliciousResult)
                {
                    result.Add(new Story
                    {
                        Service = "Service2",
                        Source = story["name"].ToString(),
                        Description = story["description"].ToString()
                    });
                }
            }

            return result;
        }
    }
}
