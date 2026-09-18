import { ParticipantResult, Competition, TeamResult, ManualCertificate } from '../types';

export const ExportService = {
  exportToCSV(results: ParticipantResult[], competitionName: string): void {
    if (!results || results.length === 0) {
      alert('لا توجد نتائج مسجلة لتصديرها.');
      return;
    }

    const headers = [
      'الترتيب',
      'اسم المشارك',
      'المدرسة / الجهة',
      'الفريق',
      'الدرجة',
      'الإجابات الصحيحة',
      'إجمالي الأسئلة',
      'الوقت المستغرق (ثواني)',
      'تاريخ ووقت المشاركة'
    ];

    const rows = results.map(r => [
      r.rank || '-',
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.school || '-').replace(/"/g, '""')}"`,
      `"${(r.teamName || '-').replace(/"/g, '""')}"`,
      r.score,
      r.correctAnswers,
      r.totalQuestions,
      r.totalTimeSeconds.toFixed(1),
      `"${r.submittedAt ? new Date(r.submittedAt).toLocaleString('ar-SA') : '-'}"`
    ]);

    // Include UTF-8 BOM for Arabic characters in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeName = competitionName.replace(/[\s\\\/:]+/g, '_');
    link.setAttribute('download', `نتائج_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  printReport(results: ParticipantResult[], competition: Competition, teamResults?: TeamResult[]): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.');
      return;
    }

    const rowsHtml = results.map(r => `
      <tr style="border-bottom: 1px solid #e2e8f0; text-align: center;">
        <td style="padding: 10px; font-weight: bold;">${r.rank || '-'}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #0f172a;">${r.name}</td>
        <td style="padding: 10px; text-align: right; color: #475569;">${r.school || '-'}</td>
        ${competition.participationType === 'team' ? `<td style="padding: 10px; color: #0369a1; font-weight: 600;">${r.teamName || '-'}</td>` : ''}
        <td style="padding: 10px; color: #059669; font-weight: 800; font-size: 15px;">${r.score}</td>
        <td style="padding: 10px;">${r.correctAnswers} / ${r.totalQuestions}</td>
        <td style="padding: 10px; color: #475569;">${r.totalTimeSeconds.toFixed(1)} ثانية</td>
        <td style="padding: 10px; font-size: 12px; color: #64748b;">${r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString('ar-SA') : '-'}</td>
      </tr>
    `).join('');

    const teamRowsHtml = teamResults && teamResults.length > 0 ? `
      <h3 style="font-size: 16px; color: #0f172a; margin-top: 25px; margin-bottom: 10px;">ترتيب الفرق الجماعي</h3>
      <table>
        <thead>
          <tr>
            <th>المركز</th>
            <th>اسم الفريق</th>
            <th>المدرسة</th>
            <th>عدد الأعضاء</th>
            <th>مجموع الدرجات</th>
            <th>متوسط الدرجات</th>
            <th>متوسط الوقت</th>
          </tr>
        </thead>
        <tbody>
          ${teamResults.map(t => `
            <tr style="border-bottom: 1px solid #e2e8f0; text-align: center;">
              <td style="padding: 8px; font-weight: bold;">${t.rank || '-'}</td>
              <td style="padding: 8px; font-weight: bold; color: #0369a1;">${t.teamName}</td>
              <td style="padding: 8px; color: #475569;">${t.school}</td>
              <td style="padding: 8px;">${t.membersCount}</td>
              <td style="padding: 8px; color: #059669; font-weight: bold;">${t.totalScore}</td>
              <td style="padding: 8px;">${t.averageScore}</td>
              <td style="padding: 8px;">${t.averageTime} ثانية</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>تقرير نتائج: ${competition.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; }
          .header { border-bottom: 3px solid #0f766e; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 22px; font-weight: 900; color: #0f766e; margin: 0; }
          .meta { font-size: 13px; color: #475569; line-height: 1.7; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { background: #f1f5f9; padding: 10px; font-weight: 700; color: #1e293b; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: #334155; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
          @media print {
            button { display: none; }
            body { margin: 15px; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: left; margin-bottom: 15px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #0f766e; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: 'Cairo'; font-weight: bold; font-size: 14px;">🖨️ طباعة التقرير أو حفظ PDF</button>
        </div>
        <div class="header">
          <div>
            <h1 class="title">تقرير النتائج المعتمد — ${competition.name}</h1>
            <div class="meta">
              نوع المسابقة: <b>${competition.source === 'platform' ? 'مسابقة منصة عامة' : 'مسابقة معلم خاصة'}</b> | نمط المشاركة: <b>${competition.participationType === 'team' ? 'فرق جماعية' : 'فردي'}</b><br>
              المعلم المشرف: <b>${competition.teacherDisplayName}</b> | الصرح التعليمي: <b>${competition.schoolName}</b><br>
              تاريخ إصدار التقرير: <b>${new Date().toLocaleDateString('ar-SA')}</b>
            </div>
          </div>
          <div style="text-align: center; border: 2px solid #0f766e; padding: 10px 20px; border-radius: 12px; background: #f0fdfa;">
            <div style="font-size: 12px; color: #0f766e; font-weight: bold;">إجمالي المتسابقين</div>
            <div style="font-size: 26px; font-weight: 900; color: #134e4a;">${results.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>المركز</th>
              <th>اسم المتسابق</th>
              <th>المدرسة</th>
              ${competition.participationType === 'team' ? '<th>الفريق</th>' : ''}
              <th>الدرجة</th>
              <th>الإجابات</th>
              <th>الوقت المستغرق</th>
              <th>وقت التسليم</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        ${teamRowsHtml}

        <div class="footer">
          <div>توقيع المعلم المشرف: _____________________</div>
          <div>ختم المدرسة / الإدارة: _____________________</div>
          <div>اعتماد المنصة الرقمية: ✓ موثق</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  },

  printCertificateHTML(params: {
    studentName: string;
    teacherName: string;
    schoolName: string;
    competitionTitle: string;
    platformName?: string;
    rank?: number;
    score?: number;
    dateStr?: string;
    verificationCode?: string;
    isManual?: boolean;
    reason?: string;
  }): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة الشهادة.');
      return;
    }

    const verCode = params.verificationCode || `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const dateStr = params.dateStr || new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>شهادة شكر وتقدير — ${params.studentName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,700&family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Cairo', sans-serif;
            background: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .action-bar {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 999;
          }
          .btn-print {
            background: linear-gradient(135deg, #d97706, #b45309);
            color: #ffffff;
            font-family: 'Cairo', sans-serif;
            font-size: 15px;
            font-weight: 800;
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
          }
          .cert-container {
            width: 1050px;
            height: 740px;
            background: #ffffff;
            position: relative;
            padding: 40px;
            border-radius: 4px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }
          /* Royal Ornamental Outer Borders */
          .outer-border {
            position: absolute;
            inset: 16px;
            border: 3px solid #b45309;
            border-radius: 2px;
            pointer-events: none;
          }
          .inner-border {
            position: absolute;
            inset: 22px;
            border: 1px solid #d97706;
            outline: 1px dashed #ca8a04;
            outline-offset: -5px;
            pointer-events: none;
          }
          .corner-ornament {
            position: absolute;
            width: 50px;
            height: 50px;
            border-color: #b45309;
            pointer-events: none;
          }
          .corner-tl { top: 22px; right: 22px; border-top: 4px double #b45309; border-right: 4px double #b45309; }
          .corner-tr { top: 22px; left: 22px; border-top: 4px double #b45309; border-left: 4px double #b45309; }
          .corner-bl { bottom: 22px; right: 22px; border-bottom: 4px double #b45309; border-right: 4px double #b45309; }
          .corner-br { bottom: 22px; left: 22px; border-bottom: 4px double #b45309; border-left: 4px double #b45309; }

          .cert-header {
            text-align: center;
            margin-top: 10px;
            position: relative;
            z-index: 2;
          }
          .platform-title {
            font-size: 13px;
            font-weight: 800;
            color: #047857;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          .main-heading {
            font-family: 'Amiri', serif;
            font-size: 42px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
            line-height: 1.1;
          }
          .gold-subheading {
            display: inline-block;
            color: #b45309;
            font-size: 15px;
            font-weight: 700;
            border-bottom: 2px solid #f59e0b;
            padding-bottom: 4px;
            margin-top: 6px;
          }

          .cert-body {
            text-align: center;
            margin: 20px auto 0;
            max-width: 850px;
            position: relative;
            z-index: 2;
          }
          .present-to {
            font-size: 16px;
            color: #475569;
            margin-bottom: 10px;
          }
          .student-name-box {
            margin: 10px 0 16px;
          }
          .student-name {
            font-family: 'Amiri', serif;
            font-size: 44px;
            font-weight: 700;
            color: #0f172a;
            display: inline-block;
            padding: 4px 30px;
            border-bottom: 3px double #d97706;
          }
          .cert-text {
            font-size: 16px;
            line-height: 1.8;
            color: #334155;
            margin: 0 auto;
            max-width: 760px;
          }
          .highlight {
            color: #0f766e;
            font-weight: 800;
          }

          .achievement-pill {
            display: inline-flex;
            gap: 25px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            padding: 8px 30px;
            border-radius: 9999px;
            margin-top: 15px;
            font-size: 14px;
            font-weight: 700;
            color: #92400e;
          }

          .cert-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 20px;
            padding-top: 10px;
            position: relative;
            z-index: 2;
          }
          .sign-block {
            text-align: center;
            width: 240px;
          }
          .sign-role {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 6px;
          }
          .sign-name {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
          }
          .school-name {
            font-size: 12px;
            color: #475569;
            margin-top: 2px;
          }

          .gold-seal {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: radial-gradient(circle, #fef3c7 0%, #f59e0b 60%, #b45309 100%);
            border: 3px dashed #78350f;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            color: #78350f;
            text-align: center;
            font-weight: 900;
            padding: 6px;
          }
          .seal-star { font-size: 18px; margin-bottom: -2px; }
          .seal-text { font-size: 11px; line-height: 1.2; font-weight: 800; }

          .verification-box {
            text-align: right;
            font-size: 11px;
            color: #94a3b8;
            font-family: monospace;
          }

          @media print {
            body {
              padding: 0;
              background: transparent;
            }
            .action-bar { display: none; }
            .cert-container {
              box-shadow: none;
              border-radius: 0;
              width: 100vw;
              height: 100vh;
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <button class="btn-print" onclick="window.print()">🖨️ طباعة الشهادة الرسمية أو حفظ PDF</button>
        </div>

        <div class="cert-container">
          <div class="outer-border"></div>
          <div class="inner-border"></div>
          <div class="corner-ornament corner-tl"></div>
          <div class="corner-ornament corner-tr"></div>
          <div class="corner-ornament corner-bl"></div>
          <div class="corner-ornament corner-br"></div>

          <!-- Header -->
          <div class="cert-header">
            <div class="platform-title">منصة المسابقات التعليمية الرقمية</div>
            <h1 class="main-heading">شَهَادَةُ تَمَيُّـزٍ وَتَقْدِيـرٍ</h1>
            <div class="gold-subheading">وسام التفوق والإنجاز المعرفي</div>
          </div>

          <!-- Body -->
          <div class="cert-body">
            <div class="present-to">يَسُرُّ إِدَارَةَ المَسَابِقَاتِ أَنْ تَمْنَحَ هَذِهِ الشَّهَادَةَ بِكُلِّ فَخْرٍ لِلْمُتَمَيِّزِ / المتميّزة:</div>
            
            <div class="student-name-box">
              <span class="student-name">${params.studentName}</span>
            </div>

            <div class="cert-text">
              ${params.isManual
                ? `نظير الجهد المثمر والمشاركة الاستثنائية في <b class="highlight">${params.reason || params.competitionTitle}</b>، وتقديراً لشغفه بالمعرفة والتميز العلمي المستمر في <b class="highlight">${params.schoolName}</b>.`
                : `نظير مشاركته الفاعلة وإحرازه مركزاً متقدماً ${params.rank ? `(المركز #${params.rank})` : ''} في مسابقة:<br>
                   <b class="highlight" style="font-size: 19px;">${params.competitionTitle}</b><br>
                   متمنين له دوام العطاء ومواصلة مسيرة التفوق والابتكار نحو مستقبل مشرق.`
              }
            </div>

            ${!params.isManual && params.score !== undefined ? `
              <div class="achievement-pill">
                <span>🏅 الدرجة المحققة: ${params.score} نقطة</span>
                ${params.rank ? `<span>🏆 الترتيب: المركز ${params.rank}</span>` : ''}
                <span>🏛️ الصرح التعليمي: ${params.schoolName}</span>
              </div>
            ` : `
              <div class="achievement-pill">
                <span>⭐ وسام الاستحقاق والتفوق الدراسي</span>
                <span>🏛️ الصرح التعليمي: ${params.schoolName}</span>
              </div>
            `}
          </div>

          <!-- Footer -->
          <div class="cert-footer">
            <div class="sign-block">
              <div class="sign-role">المعلم المشرف والراعي</div>
              <div class="sign-name">${params.teacherName}</div>
              <div class="school-name">${params.schoolName}</div>
            </div>

            <div class="gold-seal">
              <div class="seal-star">★</div>
              <div class="seal-text">معتمدة وموثقة<br>إنجاز معتمد</div>
            </div>

            <div class="sign-block">
              <div class="sign-role">تاريخ الاعتماد الرسمي</div>
              <div class="sign-name">${dateStr}</div>
              <div class="verification-box" style="margin-top: 4px;">كود التحقق: ${verCode}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
  }
};
