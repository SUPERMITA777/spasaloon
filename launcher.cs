using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace AuraSuiteLauncher
{
    static class Program
    {
        private static bool IsServerListening(int port = 3100)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://localhost:" + port + "/api/info");
                req.Timeout = 600;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;

                // 1. Iniciar servidor local en segundo plano de forma 100% oculta
                if (!IsServerListening(3100))
                {
                    ProcessStartInfo serverPsi = new ProcessStartInfo();
                    serverPsi.FileName = "cmd.exe";
                    serverPsi.Arguments = "/c npx tsx server/index.ts";
                    serverPsi.WorkingDirectory = baseDir;
                    serverPsi.WindowStyle = ProcessWindowStyle.Hidden;
                    serverPsi.CreateNoWindow = true;
                    serverPsi.UseShellExecute = false;
                    Process.Start(serverPsi);

                    // Esperar brevemente a que el servidor inicialice
                    for (int i = 0; i < 20; i++)
                    {
                        Thread.Sleep(200);
                        if (IsServerListening(3100)) break;
                    }
                }

                // 2. Iniciar la ventana nativa de escritorio de forma limpia (sin consola CMD)
                string electronCmd = Path.Combine(baseDir, "node_modules", ".bin", "electron.cmd");
                if (File.Exists(electronCmd))
                {
                    ProcessStartInfo appPsi = new ProcessStartInfo();
                    appPsi.FileName = "cmd.exe";
                    appPsi.Arguments = "/c \"" + electronCmd + "\" .";
                    appPsi.WorkingDirectory = baseDir;
                    appPsi.WindowStyle = ProcessWindowStyle.Hidden;
                    appPsi.CreateNoWindow = true;
                    appPsi.UseShellExecute = false;
                    Process.Start(appPsi);
                }
                else
                {
                    Process.Start("http://localhost:3100");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al iniciar Aura Suite: " + ex.Message, "Aura Suite", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
