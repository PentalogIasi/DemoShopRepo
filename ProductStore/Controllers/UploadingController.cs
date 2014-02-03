using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Runtime.Remoting.Channels;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using ProductStore.Infrastructure;
using ProductStore.Models;

namespace ProductStore.Controllers
{
    public class UploadingController : ApiController
    {
        public Task<IEnumerable<FileDesc>> Post()
        {
            var folderName = "uploads";
            var PATH = HttpContext.Current.Server.MapPath("~/" + folderName);
            var rootUrl = Request.RequestUri.AbsoluteUri.Replace(Request.RequestUri.AbsolutePath, String.Empty);
            if (Request.Content.IsMimeMultipartContent())
            {
                var streamProvider = new CustomMultipartFormDataStreamProvider(PATH);
                var task = Request.Content.ReadAsMultipartAsync(streamProvider).ContinueWith<IEnumerable<FileDesc>>(t =>
                {

                    if (t.IsFaulted || t.IsCanceled)
                    {
                        throw new HttpResponseException(HttpStatusCode.InternalServerError);
                    }

                    var fileInfo = streamProvider.FileData.Select(i =>
                    {
                        var info = new FileInfo(i.LocalFileName);
                        return new FileDesc(info.Name, rootUrl + "/" + folderName + "/" + info.Name, info.Length / 1024);
                    });
                    return fileInfo;
                });

                return task;
            }
            else
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotAcceptable, "This request is not properly formatted"));
            }
        }

        public IEnumerable<FileDesc> GetFiles()
        {
            const string folderName = "uploads";
            var PATH = HttpContext.Current.Server.MapPath("~/" + folderName);
            var dir = new DirectoryInfo(PATH);

            return dir.GetFiles().Select(f => new FileDesc(f.Name, HttpUtility.HtmlEncode("file:///" + PATH + @"\" + f.Name), f.Length)).ToList();
        }
    }
}
