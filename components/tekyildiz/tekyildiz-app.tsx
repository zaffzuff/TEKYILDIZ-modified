"use client";

import { TekyildizProvider, useTekyildiz } from "@/contexts/tekyildiz-context";
import { LoadingScreen, StorageNotice } from "./feedback";
import { BottomNav } from "./bottom-nav";
import { OverviewScreen } from "./overview-screen";
import { ActivityScreen } from "./activity-screen";
import { DirectoryScreen } from "./directory-screen";
import { TrendsScreen } from "./trends-screen";
import { AboutScreen } from "./about-screen";

function AppInner() {
  const {
    ready,
    storageTrouble,
    data,
    activeTab,
    setActiveTab,
    appSort,
    setAppSort,
    projectSort,
    setProjectSort,
  } = useTekyildiz();

  if (!ready) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background">
      <StorageNotice show={storageTrouble} />

      <main className="pb-20">
        {activeTab === "overview" && (
          <OverviewScreen data={data} onNavigate={setActiveTab} />
        )}
        {activeTab === "activity" && <ActivityScreen data={data} />}
        {activeTab === "apps" && (
          <DirectoryScreen kind="app" data={data} sort={appSort} onSort={setAppSort} />
        )}
        {activeTab === "projects" && (
          <DirectoryScreen
            kind="project"
            data={data}
            sort={projectSort}
            onSort={setProjectSort}
          />
        )}
        {activeTab === "trends" && <TrendsScreen data={data} />}
        {activeTab === "about" && <AboutScreen />}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export function TekyildizApp() {
  return (
    <TekyildizProvider>
      <AppInner />
    </TekyildizProvider>
  );
}
