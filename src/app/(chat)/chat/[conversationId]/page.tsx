import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getUserConversationsAction,
  getConversationDetailsAction,
} from "@/actions/chat.actions";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatRoom } from "@/components/chat/ChatRoom";

interface ChatConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/chat/${conversationId}`);
  }

  // Cargar lista de conversaciones y el detalle de la conversación activa en paralelo
  const [conversationsRes, detailRes] = await Promise.all([
    getUserConversationsAction(),
    getConversationDetailsAction(conversationId),
  ]);

  if (detailRes.error || !detailRes.conversation) {
    redirect("/chat");
  }

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* Sidebar oculto en pantallas pequeñas cuando se ve una conversación */}
      <div className="hidden md:block h-full">
        <ChatSidebar
          conversations={conversationsRes.conversations || []}
          currentConversationId={conversationId}
        />
      </div>

      {/* Sala de Chat activa */}
      <ChatRoom
        conversation={detailRes.conversation}
        caseData={detailRes.caseData!}
        isClient={detailRes.isClient!}
        currentUser={detailRes.currentUser!}
        counterpart={detailRes.counterpart!}
        consultation={detailRes.consultation}
        initialMessages={detailRes.messages || []}
      />
    </div>
  );
}
