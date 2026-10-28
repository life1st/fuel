import { FC, useEffect, useState } from "react";
import { List, Modal, Form, Input, Toast, Tag } from "antd-mobile";
import { QuestionCircleOutline } from "antd-mobile-icons";
import useSettingStore, { GistConfig } from "@/store/setting-store";
import useRecordStore from "@/store/recordStore";
import gistSync from "@/utils/sync/gist-provider";
import syncManager from "@/utils/sync/sync-manager";
import "./style.scss";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { DEFAULT_VEHICLE_ID, DEFAULT_VEHICLE_NAME } from "@/utils/consts";
import PlateInput from "@/components/plate-input";
import PlateDisplay from "@/components/plate-display";

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.locale("zh-cn");

const SyncSetting: FC = () => {
  const [form] = Form.useForm<GistConfig>();
  const {
    gistConfig,
    setGistConfig,
    syncTime,
    vehicleId,
    setVehicleId,
    syncStatus,
    pendingChanges,
    clearAllConfig,
  } = useSettingStore();
  const { switchVehicle } = useRecordStore();
  const [files, setFiles] = useState<Record<string, { content?: string }>>({});

  const token = gistConfig?.token;
  const gistId = gistConfig?.gistId;

  useEffect(() => {
    const fetchFileList = async () => {
      if (!token || !gistId) return;
      try {
        gistSync.setToken(token);
        const response = await gistSync.get(gistId);
        setFiles(response.data.files);
      } catch (e) {
        console.warn("获取 Gist 文件列表失败", e);
      }
    };
    void fetchFileList();
  }, [token, gistId, syncTime]);

  const showGistConfigModal = () => {
    const handleSubmit = async () => {
      let values = null;
      try {
        values = await form.validateFields();
      } catch {
        Toast.show({
          icon: "fail",
          content: "请填写完整信息",
        });
        return;
      }
      setGistConfig(values);
      Toast.show({
        icon: "success",
        content: "配置已保存，已开启后台自动静默同步",
      });
      // 保存后立即尝试自动同步
      setTimeout(() => {
        void syncManager.sync();
      }, 500);
    };

    void Modal.confirm({
      title: "Gist 云同步设置",
      content: (
        <Form
          form={form}
          initialValues={gistConfig ?? {}}
          layout="vertical"
          className="sync-form"
        >
          <Form.Item
            label={
              <>
                Personal Access Token
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.github.com/zh/enterprise-cloud@latest/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#%E5%88%9B%E5%BB%BA-fine-grained-personal-access-token"
                >
                  <QuestionCircleOutline />
                </a>
              </>
            }
            name="token"
            rules={[{ required: true, message: "请输入 Token" }]}
          >
            <Input placeholder="请输入包含 Gist 权限的 GitHub Token" />
          </Form.Item>
          <Form.Item
            label="Gist ID"
            name="gistId"
            rules={[{ required: true, message: "请输入 Gist ID" }]}
          >
            <Input placeholder="请输入现有的 Gist ID" />
          </Form.Item>
        </Form>
      ),
      onConfirm: handleSubmit,
    });
  };

  const handleManualSync = async () => {
    if (!gistConfig || !gistId) {
      showGistConfigModal();
      return;
    }

    Toast.show({
      icon: "loading",
      content: "静默同步中...",
      duration: 1500,
    });

    const success = await syncManager.sync(undefined, false);
    if (success) {
      Toast.show({
        icon: "success",
        content: "数据已对齐并同步至最新",
      });
    } else {
      Toast.show({
        icon: "fail",
        content: "同步失败，请检查网络或配置",
      });
    }
  };

  const handleShowSyncModal = () => {
    if (!gistConfig) {
      showGistConfigModal();
      return;
    }

    void Modal.alert({
      title: "云同步与账本",
      content: (
        <List>
          <List.Item onClick={handleManualSync}>立即同步 (双向合并)</List.Item>
          <List.Item onClick={showGistConfigModal}>修改 Gist 配置</List.Item>
          <List.Item
            onClick={() => {
              void Modal.confirm({
                title: "断开云同步",
                content: "确定要断开 Gist 连接吗？本地账本数据将被完整保留。",
                onConfirm: () => {
                  clearAllConfig();
                  Toast.show({ content: "已断开云同步" });
                },
              });
            }}
          >
            <span style={{ color: "#ff4d4f" }}>断开连接</span>
          </List.Item>
        </List>
      ),
    });
  };

  const changeVehicle = () => {
    const handleAddVehicle = (plateNum: string) => {
      const cleanPlate = plateNum.trim().toUpperCase();
      if (!cleanPlate) return;
      // 切换当前车辆（安全隔离，不混淆历史账本）
      switchVehicle(cleanPlate);
      setVehicleId(cleanPlate);
      // 后台静默为新车辆初始化或拉取
      void syncManager.sync(cleanPlate);
      Modal.clear();
      Toast.show({
        icon: "success",
        content: `已切换至车辆: ${cleanPlate}`,
      });
    };

    const handleChangeVehicle = (plateNum: string) => {
      switchVehicle(plateNum);
      setVehicleId(plateNum);
      void syncManager.sync(plateNum);
      Modal.clear();
      Toast.show({
        icon: "success",
        content: `已切换至车辆: ${
          plateNum === DEFAULT_VEHICLE_ID ? DEFAULT_VEHICLE_NAME : plateNum
        }`,
      });
    };

    const fileKeys = Array.from(
      new Set([DEFAULT_VEHICLE_ID, ...Object.keys(files)])
    );

    void Modal.alert({
      title: "切换车辆账本",
      content: (
        <List>
          {fileKeys.map((filename) => (
            <List.Item
              key={filename}
              onClick={() => {
                handleChangeVehicle(filename);
              }}
              extra={filename === vehicleId ? <Tag color="primary">当前</Tag> : null}
            >
              {filename === DEFAULT_VEHICLE_ID ? (
                DEFAULT_VEHICLE_NAME
              ) : (
                <PlateDisplay plate={filename} />
              )}
            </List.Item>
          ))}
          <List.Item>
            <PlateInput
              placeholder="新增车牌并开新账本"
              onSubmit={handleAddVehicle}
            />
          </List.Item>
        </List>
      ),
    });
  };

  const renderSyncDesc = () => {
    if (!gistId || !token) {
      return "未配置（数据仅保留在本地）";
    }

    if (syncStatus === "syncing") {
      return "🔄 正在自动双向同步...";
    }

    let statusText = syncTime ? `上次同步: ${dayjs(syncTime).fromNow()}` : "尚未同步";
    if (pendingChanges) {
      statusText += " · ⏳ 本地有待同步变更";
    } else {
      statusText += " · ✅ 已是最新";
    }
    return statusText;
  };

  const renderExtraTag = () => {
    if (!gistConfig) {
      return <Tag color="default">未开启</Tag>;
    }
    if (syncStatus === "syncing") {
      return <Tag color="primary">同步中</Tag>;
    }
    if (syncStatus === "error") {
      return <Tag color="danger">异常</Tag>;
    }
    if (syncStatus === "offline") {
      return <Tag color="warning">离线</Tag>;
    }
    return <Tag color="success">实时同步</Tag>;
  };

  return (
    <>
      <List.Item
        onClick={handleShowSyncModal}
        extra={renderExtraTag()}
        description={renderSyncDesc()}
      >
        Gist 无感云同步
      </List.Item>
      {gistConfig && (
        <List.Item
          onClick={changeVehicle}
          extra={
            vehicleId === DEFAULT_VEHICLE_ID ? (
              "默认车辆"
            ) : (
              <PlateDisplay plate={vehicleId} size="small" />
            )
          }
          description="一车一账本，数据完全独立隔离"
        >
          切换车辆
        </List.Item>
      )}
    </>
  );
};

export default SyncSetting;
