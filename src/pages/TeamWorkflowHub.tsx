import React, { useState } from 'react';
import { 
  Users, CheckSquare, Clock, Shield, GitBranch, Activity, 
  CheckCircle2, AlertTriangle, Plus, Search, Filter, Lock, 
  Unlock, FileCode, UserCheck, Play, Pause, RefreshCw, Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'LEAD_ARCHITECT' | 'BACKEND_DEV' | 'FRONTEND_DEV' | 'SECURITY_QA' | 'ERP_CONSULTANT';
  accessLevel: 'FULL_ADMIN' | 'RESTRICTED_MODULE' | 'SANDBOX_ONLY';
  assignedModules: string[];
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  tasksCompleted: number;
}

interface TaskItem {
  id: string;
  taskNumber: string;
  title: string;
  moduleName: string;
  assigneeId: string;
  assigneeName: string;
  stage: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'CODE_REVIEW' | 'TESTING' | 'DEPLOYED';
  priority: 'LOW' | 'MEDIUM' | 'URGENT' | 'CRITICAL';
  securityApprovalRequired: boolean;
  securityApproved: boolean;
  createdAt: string;
  estimatedHours: number;
}

export const TeamWorkflowHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'members' | 'audit_security' | 'performance'>('kanban');

  // Team Members State
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'm_1',
      name: 'مهندس أحمد الكوتش',
      email: 'alkootsh@gmail.com',
      role: 'LEAD_ARCHITECT',
      accessLevel: 'FULL_ADMIN',
      assignedModules: ['جميع الموديولات (ERP Full Access)'],
      status: 'ONLINE',
      tasksCompleted: 142
    },
    {
      id: 'm_2',
      name: 'م. محمود الشربيني',
      email: 'mahmoud@maro.erp',
      role: 'BACKEND_DEV',
      accessLevel: 'RESTRICTED_MODULE',
      assignedModules: ['قاعدة البيانات (PostgreSQL)', 'الـ API والـ CQRS'],
      status: 'ONLINE',
      tasksCompleted: 68
    },
    {
      id: 'm_3',
      name: 'م. ياسمين خالد',
      email: 'yasmin@maro.erp',
      role: 'FRONTEND_DEV',
      accessLevel: 'RESTRICTED_MODULE',
      assignedModules: ['شاشات نقاط البيع (POS)', 'واجهات المستودعات'],
      status: 'BUSY',
      tasksCompleted: 54
    },
    {
      id: 'm_4',
      name: 'م. طارق عبد العزيز',
      email: 'tareq@maro.erp',
      role: 'SECURITY_QA',
      accessLevel: 'FULL_ADMIN',
      assignedModules: ['فحص الأكواد، الأمان، والتشفير'],
      status: 'ONLINE',
      tasksCompleted: 91
    }
  ]);

  // Tasks Lifecycle State
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'tsk_1',
      taskNumber: 'TSK-1001',
      title: 'تطوير وتسريع محرك البحث اللحظي بالباركود في الـ POS',
      moduleName: 'ننقاط البيع (POS Terminal)',
      assigneeId: 'm_3',
      assigneeName: 'م. ياسمين خالد',
      stage: 'CODE_REVIEW',
      priority: 'URGENT',
      securityApprovalRequired: true,
      securityApproved: false,
      createdAt: '2026-08-14 09:00',
      estimatedHours: 6
    },
    {
      id: 'tsk_2',
      taskNumber: 'TSK-1002',
      title: 'ربط الشهادة الرقمية لضريبة الزكاة (ZATCA Phase 2)',
      moduleName: 'الضرائب والفواتير الإلكترونية',
      assigneeId: 'm_1',
      assigneeName: 'مهندس أحمد الكوتش',
      stage: 'DEPLOYED',
      priority: 'CRITICAL',
      securityApprovalRequired: true,
      securityApproved: true,
      createdAt: '2026-08-13 11:30',
      estimatedHours: 12
    },
    {
      id: 'tsk_3',
      taskNumber: 'TSK-1003',
      title: 'تحسين كفاءة الـ Indexes في PostgreSQL لجداول المخزون',
      moduleName: 'المستودعات والمخزون',
      assigneeId: 'm_2',
      assigneeName: 'م. محمود الشربيني',
      stage: 'IN_PROGRESS',
      priority: 'MEDIUM',
      securityApprovalRequired: false,
      securityApproved: true,
      createdAt: '2026-08-14 10:15',
      estimatedHours: 8
    },
    {
      id: 'tsk_4',
      taskNumber: 'TSK-1004',
      title: 'اختبارات الاختراق والتحقق من صلاحيات الـ RBAC',
      moduleName: 'الأمن السيبراني والصلاحيات',
      assigneeId: 'm_4',
      assigneeName: 'م. طارق عبد العزيز',
      stage: 'TESTING',
      priority: 'URGENT',
      securityApprovalRequired: true,
      securityApproved: false,
      createdAt: '2026-08-14 08:30',
      estimatedHours: 10
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newModule, setNewModule] = useState('نقاط البيع (POS)');
  const [newAssignee, setNewAssignee] = useState('م. ياسمين خالد');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'URGENT' | 'CRITICAL'>('MEDIUM');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: 'tsk_' + Date.now(),
      taskNumber: 'TSK-' + Math.floor(1000 + Math.random() * 9000),
      title: newTitle,
      moduleName: newModule,
      assigneeId: 'm_3',
      assigneeName: newAssignee,
      stage: 'BACKLOG',
      priority: newPriority,
      securityApprovalRequired: true,
      securityApproved: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      estimatedHours: 6
    };

    setTasks([newTask, ...tasks]);
    toast.success(`تم إنشاء المهمة ${newTask.taskNumber} بنجاح وإضافتها للـ Backlog`);
    setNewTitle('');
  };

  const moveTaskStage = (taskId: string, nextStage: TaskItem['stage']) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        if (nextStage === 'DEPLOYED' && t.securityApprovalRequired && !t.securityApproved) {
          toast.error('عذراً! لا يمكن نشر الكود قبل مراجعة واعتماد مسؤول الأمن السيبراني.');
          return t;
        }
        return { ...t, stage: nextStage };
      }
      return t;
    }));
    toast.success('تم تحديث مرحلة دورة العمل بنجاح');
  };

  const approveSecurity = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, securityApproved: true } : t));
    toast.success('تم اعتماد الأمان والكود البرمجي بنجاح من قبل المسؤول.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users size={16} />
            <span>موديول إدارة فريق العمل ودورة حياة المهام (Team & Task Workflow Lifecycle v4.0)</span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة فريق البرمجة، صلاحيات الوصول الدقيقة، وتتبع دورة التاسك من البداية حتى النشر الآمن</h1>
          <p className="text-slate-400 text-xs mt-1">
            منع العبث وسرقة الأكواد عبر تقييد صلاحيات المطورين، فرض بوابات المراجعة الأمنية (Security Gate)، ومتابعة مراحل التنفيذ لحظياً.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl text-xs font-bold flex items-center gap-2">
            <Shield size={16} />
            <span>حماية الملكية الفكرية مفعلة (IP Protection Active)</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('kanban')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'kanban' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <CheckSquare size={16} />
          <span>لوحة مهام دورة الحياة (Task Kanban & Pipeline)</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'members' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Users size={16} />
          <span>أعضاء الفريق وصلاحيات العزل ({members.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit_security')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'audit_security' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Shield size={16} />
          <span>سجلات الأمان ومنع تسريب الأكواد (Security Audit)</span>
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'performance' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Activity size={16} />
          <span>مؤشرات الإنتاجية والأداء (KPIs)</span>
        </button>
      </div>

      {/* Tab 1: Task Kanban & Pipeline */}
      {activeTab === 'kanban' && (
        <div className="space-y-6">
          {/* Quick Create Task Form */}
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b]">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus size={16} className="text-indigo-400" />
              <span>إضافة مهمة جديدة لدورة عمل المنصة (New Task Assignment)</span>
            </h3>
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">عنوان أو وصف التاسك *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تطوير موديول الشحن السريع..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">الموديول البرمجي</label>
                <select
                  value={newModule}
                  onChange={(e) => setNewModule(e.target.value)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="نقاط البيع (POS)">نقاط البيع (POS)</option>
                  <option value="الحسابات والضرائب">الحسابات والضرائب</option>
                  <option value="المستودعات والمخزون">المستودعات والمخزون</option>
                  <option value="النقل والشحن الذكي">النقل والشحن الذكي</option>
                  <option value="الأمان السيبراني">الأمان السيبراني</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">المسؤول المكلف</label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>إضافة التاسك</span>
              </button>
            </form>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Column 1: Backlog & ToDo */}
            <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <h4 className="text-xs font-bold text-slate-300 uppercase">قيد التخطيط والانتظار (Backlog)</h4>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold">
                  {tasks.filter(t => t.stage === 'BACKLOG' || t.stage === 'TODO').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.stage === 'BACKLOG' || t.stage === 'TODO').map(task => (
                  <div key={task.id} className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-indigo-400 font-bold">{task.taskNumber}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">{task.priority}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-relaxed">{task.title}</h5>
                    <div className="text-[10px] text-slate-400">المسؤول: <strong className="text-slate-200">{task.assigneeName}</strong></div>
                    <button
                      onClick={() => moveTaskStage(task.id, 'IN_PROGRESS')}
                      className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-[11px] font-bold transition-all"
                    >
                      بدء التنفيذ ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <h4 className="text-xs font-bold text-indigo-400 uppercase">قيد التنفيذ والبرمجة (In Progress)</h4>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold">
                  {tasks.filter(t => t.stage === 'IN_PROGRESS').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.stage === 'IN_PROGRESS').map(task => (
                  <div key={task.id} className="p-4 bg-[#0f172a] rounded-2xl border border-indigo-500/30 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-indigo-400 font-bold">{task.taskNumber}</span>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px]">{task.moduleName}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-relaxed">{task.title}</h5>
                    <div className="text-[10px] text-slate-400">المسؤول: <strong className="text-slate-200">{task.assigneeName}</strong></div>
                    <button
                      onClick={() => moveTaskStage(task.id, 'CODE_REVIEW')}
                      className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-xl text-[11px] font-bold transition-all"
                    >
                      إرسال لمراجعة الكود ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Code Review & Security Gate */}
            <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <h4 className="text-xs font-bold text-amber-400 uppercase">مراجعة الأكواد والأمان (Code Review)</h4>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold">
                  {tasks.filter(t => t.stage === 'CODE_REVIEW' || t.stage === 'TESTING').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.stage === 'CODE_REVIEW' || t.stage === 'TESTING').map(task => (
                  <div key={task.id} className="p-4 bg-[#0f172a] rounded-2xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-amber-400 font-bold">{task.taskNumber}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        task.securityApproved ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      )}>
                        {task.securityApproved ? '✓ معتمد أمنياً' : '🔒 بانتظار اعتماد الأمان'}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-relaxed">{task.title}</h5>
                    
                    {!task.securityApproved && (
                      <button
                        onClick={() => approveSecurity(task.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-all shadow-md"
                      >
                        اعتماد أمان الكود (Security Sign-off)
                      </button>
                    )}

                    <button
                      onClick={() => moveTaskStage(task.id, 'DEPLOYED')}
                      className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-[11px] font-bold transition-all"
                    >
                      نشر على سيرفر الإنتاج (Deploy) ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4: Deployed */}
            <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <h4 className="text-xs font-bold text-emerald-400 uppercase">تم النشر والاعتماد (Deployed)</h4>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold">
                  {tasks.filter(t => t.stage === 'DEPLOYED').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.stage === 'DEPLOYED').map(task => (
                  <div key={task.id} className="p-4 bg-[#0f172a] rounded-2xl border border-emerald-500/30 space-y-2 opacity-90">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-emerald-400 font-bold">{task.taskNumber}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">✅ مباشر الآن</span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-relaxed">{task.title}</h5>
                    <div className="text-[10px] text-slate-400">بواسطة: <strong className="text-slate-200">{task.assigneeName}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Team Members & RBAC */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map(member => (
              <div key={member.id} className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-lg">
                    {member.name.substring(0, 2)}
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold",
                    member.status === 'ONLINE' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {member.status === 'ONLINE' ? 'متصل الآن' : 'مشغول حالياً'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{member.name}</h3>
                  <p className="text-xs text-indigo-400">{member.email}</p>
                </div>
                <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>الدور:</span>
                    <strong className="text-white">{member.role}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>مستوى الصلاحية:</span>
                    <strong className={member.accessLevel === 'FULL_ADMIN' ? 'text-rose-400' : 'text-amber-400'}>
                      {member.accessLevel === 'FULL_ADMIN' ? 'مدير كامل النظام' : 'صلاحية مقيدة'}
                    </strong>
                  </div>
                  <div className="text-slate-400 pt-1">
                    <span>الموديولات المصرح بها:</span>
                    <div className="text-slate-200 mt-0.5 font-bold">{member.assignedModules.join(', ')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security Audit & IP Protection */}
      {activeTab === 'audit_security' && (
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] space-y-6 max-w-4xl mx-auto shadow-2xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-indigo-400" />
              <span>إجراءات الأمان وحماية الكود المصدرى من السرقة أو التعديل غير المصرّح به</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              كيف يمنع نظام MARO أي محاولة عبث أو تسريب للأكواد من قبل فريق العمل أو الأطراف الخارجية.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2">
              <h3 className="font-bold text-indigo-400 text-sm">1. عزل بيئة العمل (Developer Environment Isolation)</h3>
              <p>المبرمجون لا يمتلكون مطلقاً مفاتيح الاتصال بسيرفر الإنتاج (Production Server). يتم العمل محلياً على قاعدة بيانات تجريبية (SQLite/Local Mock) ولا يمكنهم الوصول لبيانات العملاء الفعلية في PostgreSQL السحابية.</p>
            </div>

            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2">
              <h3 className="font-bold text-emerald-400 text-sm">2. التجميع والتشفير النهائي (Bundle & Obfuscation)</h3>
              <p>يتم تجميع خادم Node.js وتشفيره إلى ملف تنفيذي واحد (`dist/server.cjs`) عبر `esbuild` بحيث يستحيل قراءة الشفرة أو سرقة خوارزميات العمليات الحسابية أو ربط الضرائب.</p>
            </div>

            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2">
              <h3 className="font-bold text-amber-400 text-sm">3. سجلات الجنائية والتدقيق الشامل (Immutable Audit Trail)</h3>
              <p>كل سطر كود يتم تعديله وكل عملية نشر (Deploy) تسجل تلقائياً باسم المبرمج، عنوان الـ IP، وساعة التعديل، مع اشتراط موافقة مدير النظام (CTO) قبل اعتماد أي دمج نهائي في الـ Production.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Performance KPIs */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase">إجمالي المهام المنجزة</div>
            <div className="text-3xl font-black text-emerald-400">355 تاسك</div>
            <p className="text-xs text-slate-400">إجمالي المهام التي تم برمجتها، فحصها أمنياً، ونشرها بنجاح.</p>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase">معدل اجتياز الفحص الأمني</div>
            <div className="text-3xl font-black text-indigo-400">99.4%</div>
            <p className="text-xs text-slate-400">نسبة نجاح المهام في اجتياز بوابة الفحص السيبراني بدون ثغرات.</p>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase">متوسط زمن إنجاز التاسك</div>
            <div className="text-3xl font-black text-amber-400">4.2 ساعة</div>
            <p className="text-xs text-slate-400">السرعة الكلية لدورة حياة التاسك من الـ Backlog وحتى النشر.</p>
          </div>
        </div>
      )}
    </div>
  );
};
